import logging
from pathlib import Path
import tempfile

from app.services.document_preprocessing_engine import PreprocessedPage


logger = logging.getLogger("contractsense.ingestion")


class PDFConverter:
    def convert_to_images(self, raw_bytes: bytes, file_name: str) -> list[PreprocessedPage]:
        pages = self._convert_with_pdf2image(raw_bytes)
        if pages:
            logger.info("PDF CONVERTER: converted %s pages with pdf2image.", len(pages))
            return pages
        pages = self._convert_with_pymupdf(raw_bytes, file_name)
        logger.info("PDF CONVERTER: converted %s pages with PyMuPDF fallback.", len(pages))
        return pages

    def _convert_with_pdf2image(self, raw_bytes: bytes) -> list[PreprocessedPage]:
        try:
            from pdf2image import convert_from_bytes  # type: ignore[import-not-found]
        except Exception:
            return []
        try:
            images = convert_from_bytes(raw_bytes, dpi=220, fmt="png")
            pages: list[PreprocessedPage] = []
            for index, image in enumerate(images, start=1):
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
                    image.save(temp_file.name, format="PNG")
                    image_bytes = Path(temp_file.name).read_bytes()
                pages.append(
                    PreprocessedPage(
                        page_number=index,
                        width=float(image.width),
                        height=float(image.height),
                        image_bytes=image_bytes,
                    )
                )
            return pages
        except Exception as error:
            logger.warning("PDF CONVERTER: pdf2image failed: %s", error)
            return []

    def _convert_with_pymupdf(self, raw_bytes: bytes, file_name: str) -> list[PreprocessedPage]:
        try:
            import fitz  # type: ignore[import-not-found]
        except Exception:
            return []
        pages: list[PreprocessedPage] = []
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_path = Path(temp_dir) / file_name
            pdf_path.write_bytes(raw_bytes)
            document = fitz.open(str(pdf_path))
            for index in range(len(document)):
                page = document.load_page(index)
                embedded = self._extract_primary_embedded_image(document, page, index)
                if embedded is not None:
                    pages.append(embedded)
                    continue
                scale = self._best_render_scale(page.rect.width, page.rect.height)
                pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
                pages.append(
                    PreprocessedPage(
                        page_number=index + 1,
                        width=float(page.rect.width),
                        height=float(page.rect.height),
                        image_bytes=pix.tobytes("png"),
                    )
                )
            document.close()
        return pages

    def _extract_primary_embedded_image(self, document, page, index: int) -> PreprocessedPage | None:
        try:
            image_refs = page.get_images(full=True)
        except Exception:
            return None
        if not image_refs:
            return None

        page_area = max(1.0, float(page.rect.width * page.rect.height))
        best_candidate: tuple[float, bytes, float, float] | None = None
        for image_ref in image_refs:
            xref = image_ref[0]
            try:
                image_info = document.extract_image(xref)
                image_bytes = image_info.get("image")
                width = float(image_info.get("width") or 0.0)
                height = float(image_info.get("height") or 0.0)
                if not image_bytes or width <= 0 or height <= 0:
                    continue
                coverage = (width * height) / page_area
                if best_candidate is None or coverage > best_candidate[0]:
                    best_candidate = (coverage, image_bytes, width, height)
            except Exception:
                continue

        if best_candidate is None:
            return None

        coverage, image_bytes, width, height = best_candidate
        if coverage < 0.30:
            return None

        logger.info(
            "PDF CONVERTER: extracted embedded image for page %s with coverage %.2f.",
            index + 1,
            coverage,
        )
        return PreprocessedPage(
            page_number=index + 1,
            width=width,
            height=height,
            image_bytes=image_bytes,
        )

    def _best_render_scale(self, width: float, height: float) -> float:
        larger_side = max(width, height)
        if larger_side <= 700:
            return 5.0
        if larger_side <= 1000:
            return 4.0
        return 3.0


pdf_converter = PDFConverter()
