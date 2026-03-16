from uuid import uuid4

from app.models.schemas import BoundingBox, ClauseSegment, DocumentElement, DocumentPage, StructuredDocument
from app.services.clause_detector import clause_detector


class DocumentStructureBuilder:
    """
    Multimodal fusion:

    Given a layout element l and a VLM element v, the fused confidence is

    s(l, v) = w_iou * IoU(b_l, b_v) + w_txt * overlap(text_l, text_v) + w_typ * 1[type_l = type_v]

    with weights:
    w_iou = 0.45, w_txt = 0.40, w_typ = 0.15

    We keep the higher-confidence evidence and use the fused path to reconstruct
    section hierarchy, clause boundaries, and visual relations.
    """

    def build(
        self,
        document_id: str,
        document_kind: str,
        extraction_method: str,
        pages: list[DocumentPage],
        vlm_result: dict | None,
        raw_text: str,
        notes: list[str] | None = None,
    ) -> StructuredDocument:
        fused_pages = self._fuse_pages(pages, vlm_result or {})
        ordered_text = self._ordered_text(fused_pages) or raw_text
        clause_segments = clause_detector.segment_document(ordered_text)
        hierarchy = self._derive_hierarchy(fused_pages)

        return StructuredDocument(
            documentId=document_id,
            documentKind=document_kind,  # type: ignore[arg-type]
            extractionMethod=extraction_method,
            pages=fused_pages,
            hierarchy=hierarchy,
            clauseSegments=clause_segments,
            tables=[element for page in fused_pages for element in page.elements if element.type == "table"],
            signatures=[element for page in fused_pages for element in page.elements if element.type == "signature"],
            annotations=[element for page in fused_pages for element in page.elements if element.type == "annotation"],
            rawText=ordered_text,
            reconstructionNotes=notes or [],
        )

    def _fuse_pages(self, pages: list[DocumentPage], vlm_result: dict) -> list[DocumentPage]:
        vlm_pages = {page.get("pageNumber"): page for page in vlm_result.get("pages", []) if isinstance(page, dict)}
        fused_pages: list[DocumentPage] = []
        for page in pages:
            vlm_page = vlm_pages.get(page.pageNumber, {})
            fused_elements = list(page.elements)
            for candidate in vlm_page.get("elements", []):
                fused = self._to_vlm_element(candidate, page)
                if fused is None:
                    continue
                matched_index = self._match_existing(fused, fused_elements)
                if matched_index is None:
                    fused_elements.append(fused)
                else:
                    existing = fused_elements[matched_index]
                    fused_elements[matched_index] = self._merge_elements(existing, fused)
            fused_pages.append(
                DocumentPage(
                    pageNumber=page.pageNumber,
                    width=page.width,
                    height=page.height,
                    elements=sorted(fused_elements, key=lambda item: (item.bbox.y0 if item.bbox else 0.0, item.bbox.x0 if item.bbox else 0.0)),
                )
            )
        return fused_pages

    def _to_vlm_element(self, payload: dict, page: DocumentPage) -> DocumentElement | None:
        element_type = str(payload.get("type") or "").strip().lower()
        if element_type not in {"title", "section", "subsection", "clause", "table", "list", "signature", "footnote", "paragraph", "annotation"}:
            return None
        bbox = payload.get("bboxNormalized") or payload.get("bbox") or []
        bbox_model = None
        if isinstance(bbox, list) and len(bbox) == 4:
            x0, y0, x1, y1 = [float(value) for value in bbox]
            bbox_model = BoundingBox(
                x0=max(0.0, x0 * page.width),
                y0=max(0.0, y0 * page.height),
                x1=max(0.0, x1 * page.width),
                y1=max(0.0, y1 * page.height),
                pageWidth=page.width,
                pageHeight=page.height,
            )
        return DocumentElement(
            elementId=f"vlm-{uuid4().hex[:10]}",
            type=element_type,  # type: ignore[arg-type]
            text=str(payload.get("text") or "").strip(),
            pageNumber=page.pageNumber,
            bbox=bbox_model,
            confidence=0.74,
            hierarchyPath=[str(item) for item in payload.get("hierarchyPath", []) if str(item).strip()],
            metadata={"source": "vlm_inference"},
        )

    def _match_existing(self, candidate: DocumentElement, existing: list[DocumentElement]) -> int | None:
        best_index = None
        best_score = 0.0
        for index, item in enumerate(existing):
            score = self._fusion_score(item, candidate)
            if score > best_score:
                best_index = index
                best_score = score
        return best_index if best_score >= 0.55 else None

    def _merge_elements(self, base: DocumentElement, candidate: DocumentElement) -> DocumentElement:
        return DocumentElement(
            elementId=base.elementId,
            type=candidate.type if candidate.confidence >= base.confidence else base.type,
            text=candidate.text if len(candidate.text) > len(base.text) else base.text,
            pageNumber=base.pageNumber,
            bbox=candidate.bbox or base.bbox,
            confidence=min(0.99, max(base.confidence, candidate.confidence) + 0.06),
            hierarchyPath=candidate.hierarchyPath or base.hierarchyPath,
            parentId=base.parentId,
            children=base.children,
            tableCells=base.tableCells or candidate.tableCells,
            metadata={**base.metadata, **candidate.metadata},
        )

    def _fusion_score(self, left: DocumentElement, right: DocumentElement) -> float:
        iou = self._bbox_iou(left.bbox, right.bbox)
        text_overlap = self._text_overlap(left.text, right.text)
        type_bonus = 1.0 if left.type == right.type else 0.0
        return round(0.45 * iou + 0.40 * text_overlap + 0.15 * type_bonus, 3)

    def _bbox_iou(self, left: BoundingBox | None, right: BoundingBox | None) -> float:
        if left is None or right is None:
            return 0.0
        inter_x0 = max(left.x0, right.x0)
        inter_y0 = max(left.y0, right.y0)
        inter_x1 = min(left.x1, right.x1)
        inter_y1 = min(left.y1, right.y1)
        if inter_x1 <= inter_x0 or inter_y1 <= inter_y0:
            return 0.0
        intersection = (inter_x1 - inter_x0) * (inter_y1 - inter_y0)
        left_area = max(1.0, (left.x1 - left.x0) * (left.y1 - left.y0))
        right_area = max(1.0, (right.x1 - right.x0) * (right.y1 - right.y0))
        union = left_area + right_area - intersection
        return max(0.0, min(1.0, intersection / union))

    def _text_overlap(self, left: str, right: str) -> float:
        if not left or not right:
            return 0.0
        left_tokens = {token.lower() for token in left.split() if len(token) > 2}
        right_tokens = {token.lower() for token in right.split() if len(token) > 2}
        if not left_tokens or not right_tokens:
            return 0.0
        return len(left_tokens & right_tokens) / len(left_tokens | right_tokens)

    def _ordered_text(self, pages: list[DocumentPage]) -> str:
        lines: list[str] = []
        for page in pages:
            for element in page.elements:
                if element.text:
                    lines.append(element.text.strip())
        return "\n".join(line for line in lines if line)

    def _derive_hierarchy(self, pages: list[DocumentPage]) -> list[str]:
        hierarchy: list[str] = []
        for page in pages:
            for element in page.elements:
                if element.type in {"title", "section", "subsection"} and element.text and element.text not in hierarchy:
                    hierarchy.append(element.text)
        return hierarchy[:200]


document_structure_builder = DocumentStructureBuilder()
