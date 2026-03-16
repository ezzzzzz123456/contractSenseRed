from uuid import uuid4
import re

from app.models.schemas import BoundingBox, DocumentElement, DocumentPage
from app.services.document_preprocessing_engine import PreprocessedDocument


class LayoutDetectionEngine:
    def detect(self, preprocessed: PreprocessedDocument) -> list[DocumentPage]:
        pages: list[DocumentPage] = []
        for page in preprocessed.pages:
            elements: list[DocumentElement] = []
            for x0, y0, x1, y1, text in page.source_blocks:
                element_type = self._classify_block(text)
                elements.append(
                    DocumentElement(
                        elementId=f"el-{uuid4().hex[:10]}",
                        type=element_type,  # type: ignore[arg-type]
                        text=text,
                        pageNumber=page.page_number,
                        bbox=BoundingBox(
                            x0=max(0.0, x0),
                            y0=max(0.0, y0),
                            x1=max(0.0, x1),
                            y1=max(0.0, y1),
                            pageWidth=page.width,
                            pageHeight=page.height,
                        ),
                        confidence=self._confidence_for_type(text, element_type),
                        metadata={"source": "pymupdf_block_layout"},
                    )
                )
            pages.append(
                DocumentPage(
                    pageNumber=page.page_number,
                    width=page.width,
                    height=page.height,
                    elements=elements,
                )
            )
        return pages

    def _classify_block(self, text: str) -> str:
        cleaned = text.strip()
        lowered = cleaned.lower()
        if not cleaned:
            return "paragraph"
        if cleaned.isupper() and len(cleaned.split()) <= 14:
            return "title" if len(cleaned.split()) <= 6 else "section"
        if re.match(r"^(section|article|chapter|part)\b", lowered):
            return "section"
        if re.match(r"^\d+[A-Z]?(?:\.\d+)*[\).]?\s+", cleaned):
            return "clause"
        if re.match(r"^[-*]\s+|^[a-zA-Z]\)\s+", cleaned):
            return "list"
        if "signature" in lowered or "signed" in lowered:
            return "signature"
        if "note" in lowered or "footnote" in lowered:
            return "footnote"
        if "\t" in cleaned or cleaned.count("  ") >= 3:
            return "table"
        return "paragraph"

    def _confidence_for_type(self, text: str, element_type: str) -> float:
        base = {
            "title": 0.8,
            "section": 0.76,
            "clause": 0.78,
            "table": 0.64,
            "list": 0.72,
            "signature": 0.66,
            "footnote": 0.65,
            "paragraph": 0.62,
            "annotation": 0.5,
            "subsection": 0.7,
        }.get(element_type, 0.58)
        return min(0.96, base + min(0.12, len(text) / 2000.0))


layout_detection_engine = LayoutDetectionEngine()
