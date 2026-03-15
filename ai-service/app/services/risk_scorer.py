from app.models.schemas import FlagItem


class RiskScorerService:
    def score_clause(self, clause_text: str) -> FlagItem:
        lowered = clause_text.lower()
        if "terminate" in lowered or "unlimited liability" in lowered:
            return FlagItem(text=clause_text, riskFlag="red", explanation="High leverage or exit-risk language detected.")
        if "15 days" in lowered or "indemnify" in lowered:
            return FlagItem(text=clause_text, riskFlag="yellow", explanation="Potentially negotiable risk detected.")
        return FlagItem(text=clause_text, riskFlag="green", explanation="Balanced or routine clause language.")


risk_scorer = RiskScorerService()

