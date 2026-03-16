from dataclasses import dataclass, field
from io import BytesIO
from pathlib import Path
import tempfile


@dataclass
class PreprocessedPage:
    page_number: int
    width: float
    height: float
    image_bytes: bytes = b""
    extracted_text: str = ""
    source_blocks: list[tuple[float, float, float, float, str]] = field(default_factory=list)


@dataclass
class PreprocessedDocument:
    document_kind: str
    pages: list[PreprocessedPage] = field(default_factory=list)
    raw_text_candidates: dict[str, str] = field(default_factory=dict)
    notes: list[str] = field(default_factory=list)


class DocumentPreprocessingEngine:
    def preprocess(self, raw_bytes: bytes, file_name: str, document_kind: str) -> PreprocessedDocument:
        if document_kind == "pdf":
            return self._preprocess_pdf(raw_bytes, file_name)
        if document_kind == "image":
            return self._preprocess_image(raw_bytes)
        text = raw_bytes.decode("utf-8", errors="ignore")
        return PreprocessedDocument(
            document_kind=document_kind,
            pages=[PreprocessedPage(page_number=1, width=0.0, height=0.0, extracted_text=text)],
            raw_text_candidates={"direct": text},
            notes=["Non-visual document preprocessing used direct text fallback."],
        )

    def _preprocess_pdf(self, raw_bytes: bytes, file_name: str) -> PreprocessedDocument:
        document = PreprocessedDocument(document_kind="pdf")
        try:
            import fitz  # type: ignore[import-not-found]
        except Exception:
            document.notes.append("PyMuPDF unavailable for page rendering.")
            return document

        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_path = Path(temp_dir) / file_name
            pdf_path.write_bytes(raw_bytes)
            pdf = fitz.open(str(pdf_path))
            raw_pages: list[str] = []
            block_pages: list[str] = []
            for index in range(len(pdf)):
                page = pdf.load_page(index)
                pix = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
                image_bytes = pix.tobytes("png")
                plain_text = (page.get_text("text") or "").strip()
                blocks_raw = page.get_text("blocks")
                blocks = []
                block_texts = []
                for block in sorted(blocks_raw, key=lambda item: (round(item[1], 1), round(item[0], 1))):
                    text = (block[4] or "").strip()
                    if text:
                        blocks.append((float(block[0]), float(block[1]), float(block[2]), float(block[3]), text))
                        block_texts.append(text)
                raw_pages.append(plain_text)
                block_pages.append("\n".join(block_texts))
                document.pages.append(
                    PreprocessedPage(
                        page_number=index + 1,
                        width=float(page.rect.width),
                        height=float(page.rect.height),
                        image_bytes=image_bytes,
                        extracted_text=plain_text,
                        source_blocks=blocks,
                    )
                )
            pdf.close()
            document.raw_text_candidates["pymupdf_text"] = "\n\n".join(page for page in raw_pages if page).strip()
            document.raw_text_candidates["pymupdf_blocks"] = "\n\n".join(page for page in block_pages if page).strip()
            document.notes.append("Rendered PDF pages and extracted text blocks with PyMuPDF.")
        return document

    def _preprocess_image(self, raw_bytes: bytes) -> PreprocessedDocument:
        try:
            import fitz  # type: ignore[import-not-found]
        except Exception:
            return PreprocessedDocument(
                document_kind="image",
                pages=[PreprocessedPage(page_number=1, width=0.0, height=0.0, image_bytes=raw_bytes)],
                notes=["PyMuPDF unavailable; image dimensions omitted."],
            )

        image_doc = fitz.open(stream=BytesIO(raw_bytes).getvalue(), filetype="png")
        rect = image_doc[0].rect if len(image_doc) else None
        width = float(rect.width) if rect else 0.0
        height = float(rect.height) if rect else 0.0
        image_doc.close()
        return PreprocessedDocument(
            document_kind="image",
            pages=[PreprocessedPage(page_number=1, width=width, height=height, image_bytes=raw_bytes)],
            notes=["Prepared image page for VLM-based document understanding."],
        )


document_preprocessing_engine = DocumentPreprocessingEngine()
