class ClauseDetectorService:
    def detect_clauses(self, contract_text: str) -> list[str]:
        clauses = [segment.strip() for segment in contract_text.split(".") if segment.strip()]
        return clauses or [contract_text]


clause_detector = ClauseDetectorService()

