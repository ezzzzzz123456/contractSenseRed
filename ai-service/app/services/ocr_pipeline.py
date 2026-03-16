import base64
from io import BytesIO
import logging
import re

import httpx

from app.config import settings
from app.services.document_preprocessing_engine import PreprocessedPage
from app.services.text_block_builder import OCRTextBlock, text_block_builder


logger = logging.getLogger("contractsense.ingestion")
CONTRACT_HINTS = [
    "contract",
    "agreement",
    "payment",
    "delivery",
    "title",
    "risk",
    "products",
    "goods",
    "seller",
    "buyer",
    "standards",
    "purchased",
]


class OCRPipeline:
    def run_pages(self, pages: list[PreprocessedPage]) -> tuple[str, list[OCRTextBlock], list[str]]:
        notes: list[str] = []
        blocks: list[OCRTextBlock] = []
        for page in pages:
            page_blocks, page_notes = self._run_best_pass(page)
            notes.extend(page_notes)
            blocks.extend(page_blocks)

        logger.info("TEXT BLOCK COUNT: %s", len(blocks))
        raw_text = text_block_builder.build_text(blocks)
        logger.info("RAW OCR OUTPUT:\n%s", raw_text[:4000] if raw_text else "<empty>")
        return raw_text, text_block_builder.order_blocks(blocks), notes

    def _run_best_pass(self, page: PreprocessedPage) -> tuple[list[OCRTextBlock], list[str]]:
        variants = self._build_variants(page.image_bytes)
        best_blocks: list[OCRTextBlock] = []
        best_score = -1.0
        best_notes: list[str] = []
        for label, variant_bytes in variants:
            page_blocks = self._run_paddleocr(variant_bytes, page.page_number)
            if not page_blocks:
                logger.warning("OCR RECOGNITION: PaddleOCR returned no text on page %s, trying EasyOCR.", page.page_number)
                page_blocks = self._run_easyocr(variant_bytes, page.page_number)
            if not page_blocks:
                logger.warning("OCR RECOGNITION: EasyOCR returned no text on page %s, trying RapidOCR.", page.page_number)
                page_blocks = self._run_rapidocr(variant_bytes, page.page_number)
            if not page_blocks:
                logger.warning("OCR RECOGNITION: RapidOCR returned no text on page %s, using Gemini fallback.", page.page_number)
                fallback_text = self._run_gemini_ocr(variant_bytes)
                if fallback_text.strip():
                    page_blocks = [
                        OCRTextBlock(
                            page_number=page.page_number,
                            x0=0.0,
                            y0=0.0,
                            x1=page.width or 1000.0,
                            y1=page.height or 1400.0,
                            text=fallback_text.strip(),
                            confidence=0.55,
                        )
                    ]
            score = self._score_blocks(page_blocks)
            logger.info("OCR PASS %s: score %.3f with %s blocks.", label, score, len(page_blocks))
            if score > best_score:
                best_score = score
                best_blocks = page_blocks
                best_notes = [f"OCR variant selected: {label}."]
        return best_blocks, best_notes

    def _preprocess_image(self, image_bytes: bytes) -> bytes:
        logger.info("IMAGE PREPROCESSING: starting grayscale/threshold/deskew stage.")
        try:
            import numpy as np  # type: ignore[import-not-found]
            from PIL import Image, ImageOps  # type: ignore[import-not-found]

            image = Image.open(BytesIO(image_bytes)).convert("L")
            image = ImageOps.autocontrast(image)
            histogram = image.histogram()
            total = sum(histogram)
            weighted = sum(index * count for index, count in enumerate(histogram))
            threshold = int(weighted / max(1, total))
            image = image.point(lambda pixel: 255 if pixel > threshold else 0)
            deskewed = self._deskew(image, np)
            buffer = BytesIO()
            deskewed.save(buffer, format="PNG")
            logger.info("IMAGE PREPROCESSING: completed.")
            return buffer.getvalue()
        except Exception as error:
            logger.warning("IMAGE PREPROCESSING: fallback to original image bytes due to %s", error)
            return image_bytes

    def _build_variants(self, image_bytes: bytes) -> list[tuple[str, bytes]]:
        base = self._preprocess_image(image_bytes)
        variants = [("base_preprocessed", base)]
        try:
            from PIL import Image, ImageFilter, ImageOps  # type: ignore[import-not-found]

            image = Image.open(BytesIO(base)).convert("L")
            upscaled = ImageOps.autocontrast(image).resize((image.width * 2, image.height * 2))
            upscaled = upscaled.filter(ImageFilter.SHARPEN)
            thresholded = upscaled.point(lambda pixel: 255 if pixel > 170 else 0)
            buffer = BytesIO()
            thresholded.save(buffer, format="PNG")
            variants.append(("upscaled_thresholded", buffer.getvalue()))

            soft = ImageOps.autocontrast(image).resize((image.width * 2, image.height * 2))
            soft = soft.filter(ImageFilter.DETAIL)
            soft_buffer = BytesIO()
            soft.save(soft_buffer, format="PNG")
            variants.append(("upscaled_detail", soft_buffer.getvalue()))
        except Exception as error:
            logger.warning("IMAGE PREPROCESSING: could not build OCR variants: %s", error)
        return variants

    def _deskew(self, image, np_module):
        best_angle = 0
        best_score = float("-inf")
        for angle in range(-3, 4):
            rotated = image.rotate(angle, expand=True, fillcolor=255)
            array = np_module.asarray(rotated)
            score = np_module.var(np_module.sum(255 - array, axis=1))
            if score > best_score:
                best_score = score
                best_angle = angle
        return image.rotate(best_angle, expand=True, fillcolor=255)

    def _run_paddleocr(self, image_bytes: bytes, page_number: int) -> list[OCRTextBlock]:
        logger.info("OCR DETECTION: invoking PaddleOCR on page %s.", page_number)
        try:
            import numpy as np  # type: ignore[import-not-found]
            from PIL import Image  # type: ignore[import-not-found]
            from paddleocr import PaddleOCR  # type: ignore[import-not-found]
        except Exception as error:
            logger.warning("OCR DETECTION: PaddleOCR unavailable: %s", error)
            return []

        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            array = np.asarray(image)
            ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            result = ocr.ocr(array, cls=True)
            blocks: list[OCRTextBlock] = []
            for line_group in result or []:
                for line in line_group or []:
                    box, recognition = line
                    text = recognition[0].strip()
                    confidence = float(recognition[1])
                    if not text:
                        continue
                    xs = [point[0] for point in box]
                    ys = [point[1] for point in box]
                    blocks.append(
                        OCRTextBlock(
                            page_number=page_number,
                            x0=float(min(xs)),
                            y0=float(min(ys)),
                            x1=float(max(xs)),
                            y1=float(max(ys)),
                            text=text,
                            confidence=confidence,
                        )
                    )
            logger.info("OCR RECOGNITION: page %s produced %s blocks.", page_number, len(blocks))
            return blocks
        except Exception as error:
            logger.warning("OCR RECOGNITION: PaddleOCR failed on page %s: %s", page_number, error)
            return []

    def _run_rapidocr(self, image_bytes: bytes, page_number: int) -> list[OCRTextBlock]:
        logger.info("OCR DETECTION: invoking RapidOCR on page %s.", page_number)
        try:
            from rapidocr_onnxruntime import RapidOCR  # type: ignore[import-not-found]
        except Exception as error:
            logger.warning("OCR DETECTION: RapidOCR unavailable: %s", error)
            return []

        try:
            engine = RapidOCR()
            result, _ = engine(image_bytes)
            blocks: list[OCRTextBlock] = []
            for line in result or []:
                box = line[0]
                text = str(line[1]).strip()
                confidence = float(line[2]) if len(line) > 2 else 0.55
                if not text:
                    continue
                xs = [point[0] for point in box]
                ys = [point[1] for point in box]
                blocks.append(
                    OCRTextBlock(
                        page_number=page_number,
                        x0=float(min(xs)),
                        y0=float(min(ys)),
                        x1=float(max(xs)),
                        y1=float(max(ys)),
                        text=text,
                        confidence=confidence,
                    )
                )
            logger.info("OCR RECOGNITION: RapidOCR page %s produced %s blocks.", page_number, len(blocks))
            return blocks
        except Exception as error:
            logger.warning("OCR RECOGNITION: RapidOCR failed on page %s: %s", page_number, error)
            return []

    def _run_easyocr(self, image_bytes: bytes, page_number: int) -> list[OCRTextBlock]:
        logger.info("OCR DETECTION: invoking EasyOCR on page %s.", page_number)
        try:
            import numpy as np  # type: ignore[import-not-found]
            from easyocr import Reader  # type: ignore[import-not-found]
            from PIL import Image  # type: ignore[import-not-found]
        except Exception as error:
            logger.warning("OCR DETECTION: EasyOCR unavailable: %s", error)
            return []

        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            array = np.asarray(image)
            reader = Reader(["en"], gpu=False, verbose=False)
            result = reader.readtext(array, detail=1, paragraph=False, decoder="beamsearch")
            blocks: list[OCRTextBlock] = []
            for line in result or []:
                box, text, confidence = line
                text = str(text).strip()
                if not text:
                    continue
                xs = [point[0] for point in box]
                ys = [point[1] for point in box]
                blocks.append(
                    OCRTextBlock(
                        page_number=page_number,
                        x0=float(min(xs)),
                        y0=float(min(ys)),
                        x1=float(max(xs)),
                        y1=float(max(ys)),
                        text=text,
                        confidence=float(confidence),
                    )
                )
            logger.info("OCR RECOGNITION: EasyOCR page %s produced %s blocks.", page_number, len(blocks))
            return blocks
        except Exception as error:
            logger.warning("OCR RECOGNITION: EasyOCR failed on page %s: %s", page_number, error)
            return []

    def _run_gemini_ocr(self, image_bytes: bytes) -> str:
        if not settings.gemini_api_key:
            return ""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": "image/png",
                                    "data": base64.b64encode(image_bytes).decode("utf-8"),
                                }
                            },
                            {"text": "Read this document image and return only the exact visible text."},
                        ]
                    }
                ],
                "generationConfig": {"temperature": 0.0, "topP": 0.9, "maxOutputTokens": 4096},
            }
            response = httpx.post(url, params={"key": settings.gemini_api_key}, json=payload, timeout=90.0)
            response.raise_for_status()
            data = response.json()
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            return "\n".join(part.get("text", "").strip() for part in parts if part.get("text"))
        except Exception:
            return ""

    def _score_blocks(self, blocks: list[OCRTextBlock]) -> float:
        if not blocks:
            return 0.0
        text = "\n".join(block.text for block in blocks)
        alpha_ratio = sum(character.isalpha() for character in text) / max(1, len(text))
        avg_confidence = sum(block.confidence for block in blocks) / max(1, len(blocks))
        hint_bonus = sum(1 for hint in CONTRACT_HINTS if hint in text.lower()) / max(1, len(CONTRACT_HINTS))
        noise_penalty = len(re.findall(r"[^A-Za-z0-9\s.,:$()/\-']", text)) / max(1, len(text))
        return (0.4 * avg_confidence) + (0.25 * alpha_ratio) + (0.45 * hint_bonus) - (0.2 * noise_penalty)


ocr_pipeline = OCRPipeline()
