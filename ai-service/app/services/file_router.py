import logging
from io import BytesIO


logger = logging.getLogger("contractsense.ingestion")


class FileRouter:
    def detect_kind(self, file_name: str, media_type: str) -> str:
        lowered_name = file_name.lower()
        lowered_media = media_type.lower()
        if lowered_name.endswith(".pdf") or "pdf" in lowered_media:
            kind = "pdf"
        elif lowered_name.endswith(".docx") or "wordprocessingml" in lowered_media:
            kind = "docx"
        elif lowered_name.endswith(".doc"):
            kind = "doc"
        elif lowered_name.endswith((".jpg", ".jpeg", ".png")) or lowered_media.startswith("image/"):
            kind = "image"
        elif lowered_name.endswith(".txt") or lowered_media.startswith("text/"):
            kind = "txt"
        else:
            kind = "unknown"
        logger.info("FILE TYPE DETECTION: %s (%s)", kind, file_name)
        return kind

    def pdf_has_text_layer(self, raw_bytes: bytes) -> bool:
        try:
            from pypdf import PdfReader  # type: ignore[import-not-found]

            reader = PdfReader(BytesIO(raw_bytes))
            for page in reader.pages[: min(3, len(reader.pages))]:
                text = (page.extract_text() or "").strip()
                if text and len(text) > 40:
                    logger.info("PDF ROUTING: selectable text layer detected.")
                    return True
        except Exception as error:
            logger.warning("PDF ROUTING: text-layer probe failed: %s", error)
        try:
            import fitz  # type: ignore[import-not-found]

            document = fitz.open(stream=raw_bytes, filetype="pdf")
            for index in range(min(3, len(document))):
                page = document.load_page(index)
                text = (page.get_text("text") or "").strip()
                if text and len(text) > 40:
                    logger.info("PDF ROUTING: selectable text layer detected via PyMuPDF.")
                    document.close()
                    return True
            document.close()
        except Exception as error:
            logger.warning("PDF ROUTING: PyMuPDF text-layer probe failed: %s", error)
        logger.info("PDF ROUTING: no reliable text layer detected, OCR path required.")
        return False


file_router = FileRouter()
