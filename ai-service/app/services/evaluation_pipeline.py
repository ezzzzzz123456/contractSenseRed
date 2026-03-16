from time import perf_counter

from app.models.schemas import EvaluationMetricSet, StructuredDocument


class EvaluationPipeline:
    def evaluate(
        self,
        predicted: StructuredDocument,
        reference: StructuredDocument | None = None,
        started_at: float | None = None,
    ) -> EvaluationMetricSet:
        latency_ms = max(0.0, (perf_counter() - started_at) * 1000.0) if started_at is not None else 0.0
        if reference is None:
            layout_precision = self._layout_density_precision(predicted)
            return EvaluationMetricSet(
                documentStructureAccuracy=self._hierarchy_coherence(predicted),
                clauseDetectionAccuracy=self._clause_coverage(predicted),
                tableExtractionAccuracy=1.0 if predicted.tables else 0.0,
                layoutDetectionPrecision=layout_precision,
                processingLatencyMs=round(latency_ms, 2),
                notes=["Reference-free intrinsic evaluation used because no gold annotation was supplied."],
            )

        return EvaluationMetricSet(
            documentStructureAccuracy=self._path_overlap(predicted, reference),
            clauseDetectionAccuracy=self._segment_overlap(predicted, reference),
            tableExtractionAccuracy=self._table_overlap(predicted, reference),
            layoutDetectionPrecision=self._layout_overlap(predicted, reference),
            processingLatencyMs=round(latency_ms, 2),
            notes=["Compared predicted structure against supplied gold reference."],
        )

    def _hierarchy_coherence(self, document: StructuredDocument) -> float:
        if not document.pages:
            return 0.0
        heading_count = len([item for item in document.hierarchy if item.strip()])
        clause_count = len(document.clauseSegments)
        return min(1.0, 0.35 + min(0.3, heading_count / 40.0) + min(0.35, clause_count / 120.0))

    def _clause_coverage(self, document: StructuredDocument) -> float:
        text_length = max(1, len(document.rawText))
        clause_chars = sum(len(segment.originalText) for segment in document.clauseSegments)
        return max(0.0, min(1.0, clause_chars / text_length))

    def _layout_density_precision(self, document: StructuredDocument) -> float:
        element_count = sum(len(page.elements) for page in document.pages)
        if element_count == 0:
            return 0.0
        informative = sum(
            1 for page in document.pages for element in page.elements if element.type in {"title", "section", "clause", "table", "signature"}
        )
        return informative / element_count

    def _path_overlap(self, predicted: StructuredDocument, reference: StructuredDocument) -> float:
        pred = set(predicted.hierarchy)
        gold = set(reference.hierarchy)
        if not pred and not gold:
            return 1.0
        return len(pred & gold) / max(1, len(pred | gold))

    def _segment_overlap(self, predicted: StructuredDocument, reference: StructuredDocument) -> float:
        pred = {segment.originalText[:160] for segment in predicted.clauseSegments}
        gold = {segment.originalText[:160] for segment in reference.clauseSegments}
        if not pred and not gold:
            return 1.0
        return len(pred & gold) / max(1, len(pred | gold))

    def _table_overlap(self, predicted: StructuredDocument, reference: StructuredDocument) -> float:
        pred = len(predicted.tables)
        gold = len(reference.tables)
        if pred == gold == 0:
            return 1.0
        return min(pred, gold) / max(1, max(pred, gold))

    def _layout_overlap(self, predicted: StructuredDocument, reference: StructuredDocument) -> float:
        pred = {(element.pageNumber, element.type, element.text[:80]) for page in predicted.pages for element in page.elements}
        gold = {(element.pageNumber, element.type, element.text[:80]) for page in reference.pages for element in page.elements}
        if not pred and not gold:
            return 1.0
        return len(pred & gold) / max(1, len(pred | gold))


evaluation_pipeline = EvaluationPipeline()
