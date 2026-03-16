from datetime import datetime
from pathlib import Path
import re

from app.models.schemas import EvidenceSnippet, StoredContractRecord


class ContractRepository:
    def __init__(self) -> None:
        self.base_path = Path(__file__).resolve().parents[2] / "data" / "contracts"
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, record: StoredContractRecord) -> None:
        target = self.base_path / f"{record.contractId}.json"
        target.write_text(record.model_dump_json(indent=2), encoding="utf-8")

    def get(self, contract_id: str) -> StoredContractRecord | None:
        target = self.base_path / f"{contract_id}.json"
        if not target.exists():
            return None
        return StoredContractRecord.model_validate_json(target.read_text(encoding="utf-8"))

    def list_records(self) -> list[StoredContractRecord]:
        records: list[StoredContractRecord] = []
        for path in sorted(self.base_path.glob("*.json")):
            try:
                records.append(StoredContractRecord.model_validate_json(path.read_text(encoding="utf-8")))
            except Exception:
                continue
        return records

    def search(self, query: str, contract_id: str | None = None, top_k: int = 3) -> list[EvidenceSnippet]:
        tokens = set(self._tokenize(query))
        matches: list[EvidenceSnippet] = []
        for record in self.list_records():
            if contract_id and record.contractId != contract_id:
                continue
            for clause in record.report.clauses:
                clause_tokens = set(self._tokenize(clause.originalText + " " + clause.plainLanguage))
                overlap = len(tokens & clause_tokens)
                if not overlap:
                    continue
                score = round(min(1.0, overlap / max(1, len(tokens))), 2)
                matches.append(
                    EvidenceSnippet(
                        contractId=record.contractId,
                        clauseId=clause.clauseId,
                        score=score,
                        snippet=clause.originalText[:240],
                    )
                )
        matches.sort(key=lambda item: item.score, reverse=True)
        return matches[:top_k]

    def upsert_report(self, contract_id: str, report, searchable_text: str) -> StoredContractRecord:
        now = datetime.utcnow()
        existing = self.get(contract_id)
        created_at = existing.createdAt if existing else now
        record = StoredContractRecord(
            contractId=contract_id,
            report=report,
            searchableText=searchable_text,
            createdAt=created_at,
            updatedAt=now,
        )
        self.save(record)
        return record

    def _tokenize(self, text: str) -> list[str]:
        return re.findall(r"[a-zA-Z]{3,}", text.lower())


contract_repository = ContractRepository()
