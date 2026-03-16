import unittest

from app.models.schemas import BoundingBox, DocumentElement, DocumentPage, StructuredDocument
from app.services.clause_detector import clause_detector
from app.services.document_structure_builder import document_structure_builder
from app.services.evaluation_pipeline import evaluation_pipeline


class DocumentUnderstandingTests(unittest.TestCase):
    def test_clause_detector_keeps_clause_body(self) -> None:
        text = (
            "1. Payment. Buyer shall pay within 10 days.\n"
            "2. Termination. Company may terminate for convenience.\n"
            "3. Indemnity. Supplier shall indemnify Buyer against all claims."
        )
        segments = clause_detector.segment_document(text)
        self.assertEqual(len(segments), 3)
        self.assertIn("Buyer shall pay within 10 days", segments[0].originalText)
        self.assertIn("terminate for convenience", segments[1].originalText)

    def test_structure_builder_fuses_layout_and_produces_clauses(self) -> None:
        page = DocumentPage(
            pageNumber=1,
            width=1000,
            height=1400,
            elements=[
                DocumentElement(
                    elementId="e1",
                    type="title",
                    text="MASTER SERVICES AGREEMENT",
                    pageNumber=1,
                    bbox=BoundingBox(x0=10, y0=10, x1=500, y1=60, pageWidth=1000, pageHeight=1400),
                    confidence=0.9,
                ),
                DocumentElement(
                    elementId="e2",
                    type="clause",
                    text="1. Payment. Buyer shall pay within 10 days.",
                    pageNumber=1,
                    bbox=BoundingBox(x0=10, y0=80, x1=900, y1=140, pageWidth=1000, pageHeight=1400),
                    confidence=0.84,
                ),
            ],
        )
        structured = document_structure_builder.build(
            document_id="doc-1",
            document_kind="pdf",
            extraction_method="pymupdf_block_extraction",
            pages=[page],
            vlm_result={"pages": []},
            raw_text="MASTER SERVICES AGREEMENT\n1. Payment. Buyer shall pay within 10 days.",
            notes=["synthetic test"],
        )
        self.assertEqual(structured.documentKind, "pdf")
        self.assertGreaterEqual(len(structured.clauseSegments), 1)

    def test_evaluation_pipeline_reference_free(self) -> None:
        structured = StructuredDocument(
            documentId="doc-1",
            documentKind="pdf",
            extractionMethod="test",
            pages=[],
            hierarchy=["MASTER SERVICES AGREEMENT"],
            clauseSegments=clause_detector.segment_document("1. Payment. Buyer shall pay within 10 days."),
            rawText="1. Payment. Buyer shall pay within 10 days.",
        )
        metrics = evaluation_pipeline.evaluate(structured)
        self.assertGreaterEqual(metrics.documentStructureAccuracy, 0.0)
        self.assertGreaterEqual(metrics.clauseDetectionAccuracy, 0.0)


if __name__ == "__main__":
    unittest.main()
