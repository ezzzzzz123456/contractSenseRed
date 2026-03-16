import logging

from app.models.schemas import ClauseSegment
from app.services.clause_detector import clause_detector


logger = logging.getLogger("contractsense.ingestion")


class ClauseSegmenter:
    def segment(self, text: str) -> list[ClauseSegment]:
        clauses = clause_detector.segment_document(text)
        logger.info("CLAUSE SEGMENTATION: produced %s clauses.", len(clauses))
        return clauses


clause_segmenter = ClauseSegmenter()
