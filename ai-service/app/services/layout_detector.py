import logging
import re
from uuid import uuid4

from app.models.schemas import BoundingBox, DocumentElement, DocumentPage
from app.services.text_block_builder import OCRTextBlock


logger = logging.getLogger("contractsense.ingestion")


class LayoutDetector:
    def detect(self, blocks: list[OCRTextBlock], page_width: float = 1000.0, page_height: float = 1400.0) -> list[DocumentPage]:
        pages: dict[int, list[DocumentElement]] = {}
        for block in blocks:
            element_type = self._classify(block.text)
            pages.setdefault(block.page_number, []).append(
                DocumentElement(
                    elementId=f"layout-{uuid4().hex[:10]}",
                    type=element_type,  # type: ignore[arg-type]
                    text=block.text,
                    pageNumber=block.page_number,
                    bbox=BoundingBox(
                        x0=block.x0,
                        y0=block.y0,
                        x1=block.x1,
                        y1=block.y1,
                        pageWidth=page_width,
                        pageHeight=page_height,
                    ),
                    confidence=min(0.98, max(0.45, block.confidence)),
                    metadata={"source": "ocr_layout_detector"},
                )
            )
        document_pages = [
            DocumentPage(pageNumber=page_number, width=page_width, height=page_height, elements=elements)
            for page_number, elements in sorted(pages.items())
        ]
        logger.info("DETECTED LAYOUT BLOCKS: %s", sum(len(page.elements) for page in document_pages))
        return document_pages

    def _classify(self, text: str) -> str:
        lowered = text.lower().strip()
        if text.isupper() and len(text.split()) <= 12:
            return "title"
        if re.match(r"^(section|article|chapter|part)\b", lowered):
            return "section"
        if re.match(r"^\d+[A-Z]?(?:\.\d+)*[\).]?\s+", text):
            return "clause"
        if re.match(r"^\([a-z]\)\s+", lowered) or text.startswith("-"):
            return "list"
        if "signature" in lowered or "signed" in lowered:
            return "signature"
        if "\t" in text or text.count("  ") >= 3:
            return "table"
        return "paragraph"


layout_detector = LayoutDetector()
