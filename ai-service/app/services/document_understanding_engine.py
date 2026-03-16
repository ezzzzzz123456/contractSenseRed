from asyncio import run
from time import perf_counter
from uuid import uuid4

from app.models.schemas import BoundingBox, DocumentElement, DocumentPage, EvaluationMetricSet, StructuredDocument
from app.services.clause_detector import clause_detector
from app.services.document_preprocessing_engine import document_preprocessing_engine
from app.services.document_structure_builder import document_structure_builder
from app.services.evaluation_pipeline import evaluation_pipeline
from app.services.layout_detection_engine import layout_detection_engine
from app.services.layout_detector import layout_detector
from app.services.text_block_builder import OCRTextBlock
from app.services.vlm_inference_engine import vlm_inference_engine


class DocumentUnderstandingEngine:
    def process(self, raw_bytes: bytes, file_name: str, document_kind: str, extraction_method: str, normalized_text: str) -> tuple[StructuredDocument, EvaluationMetricSet]:
        started_at = perf_counter()
        preprocessed = document_preprocessing_engine.preprocess(raw_bytes, file_name, document_kind)
        layout_pages = layout_detection_engine.detect(preprocessed)
        try:
            vlm_result = run(vlm_inference_engine.infer_document(preprocessed.pages, document_kind))
        except RuntimeError:
            vlm_result = {}
        structured = document_structure_builder.build(
            document_id=f"doc-{uuid4().hex[:12]}",
            document_kind=document_kind,
            extraction_method=extraction_method,
            pages=layout_pages,
            vlm_result=vlm_result,
            raw_text=normalized_text or preprocessed.raw_text_candidates.get("pymupdf_blocks") or "",
            notes=preprocessed.notes,
        )
        evaluation = evaluation_pipeline.evaluate(structured, started_at=started_at)
        return structured, evaluation

    def process_text(self, text: str, document_kind: str, extraction_method: str) -> tuple[StructuredDocument, EvaluationMetricSet]:
        started_at = perf_counter()
        segments = clause_detector.segment_document(text)
        elements = [
            DocumentElement(
                elementId=f"text-{index:03d}",
                type="clause",
                text=segment.originalText,
                pageNumber=1,
                bbox=BoundingBox(x0=0, y0=index * 40.0, x1=1000, y1=index * 40.0 + 30.0, pageWidth=1000, pageHeight=1400),
                confidence=0.72,
                hierarchyPath=segment.hierarchy,
                metadata={"source": "text_mode"},
            )
            for index, segment in enumerate(segments, start=1)
        ]
        structured = StructuredDocument(
            documentId=f"doc-{uuid4().hex[:12]}",
            documentKind=document_kind,  # type: ignore[arg-type]
            extractionMethod=extraction_method,
            pages=[DocumentPage(pageNumber=1, width=1000, height=1400, elements=elements)],
            hierarchy=list(dict.fromkeys(segment.sectionReference for segment in segments)),
            clauseSegments=segments,
            rawText=text,
            reconstructionNotes=["Built structured document from text-mode ingestion path."],
        )
        evaluation = evaluation_pipeline.evaluate(structured, started_at=started_at)
        return structured, evaluation

    def process_ocr(
        self,
        blocks: list[OCRTextBlock],
        text: str,
        document_kind: str,
        extraction_method: str,
    ) -> tuple[StructuredDocument, EvaluationMetricSet]:
        started_at = perf_counter()
        layout_pages = layout_detector.detect(blocks)
        structured = document_structure_builder.build(
            document_id=f"doc-{uuid4().hex[:12]}",
            document_kind=document_kind,
            extraction_method=extraction_method,
            pages=layout_pages,
            vlm_result={},
            raw_text=text,
            notes=["Structured document built from OCR text blocks."],
        )
        evaluation = evaluation_pipeline.evaluate(structured, started_at=started_at)
        return structured, evaluation


document_understanding_engine = DocumentUnderstandingEngine()
