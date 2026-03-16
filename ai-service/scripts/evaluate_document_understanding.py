import json
import sys
from pathlib import Path

from app.models.schemas import StructuredDocument
from app.services.evaluation_pipeline import evaluation_pipeline


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/evaluate_document_understanding.py <predicted.json> [reference.json]")
        return 1

    predicted = StructuredDocument.model_validate_json(Path(sys.argv[1]).read_text(encoding="utf-8"))
    reference = None
    if len(sys.argv) > 2:
        reference = StructuredDocument.model_validate_json(Path(sys.argv[2]).read_text(encoding="utf-8"))

    metrics = evaluation_pipeline.evaluate(predicted, reference)
    print(json.dumps(metrics.model_dump(), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
