from statistics import mean

from app.models.schemas import ContractorCredibilityReport, CounterpartySignal
from app.services.scraper_service import scraper_service


class PartyIntelligenceService:
    def analyze(self, party_name: str, website: str | None = None, signals: list[CounterpartySignal] | None = None) -> ContractorCredibilityReport:
        signals = signals or []
        scraped_summary, scraped_sources, scraped_evidence = scraper_service.summarize_counterparty(party_name, website)

        positive = [signal for signal in signals if signal.sentiment == "positive"]
        negative = [signal for signal in signals if signal.sentiment == "negative"]
        positive.extend(
            CounterpartySignal(
                label=item.label,
                source=item.source,
                severity=item.severity,
                sentiment="positive",
                evidence=item.snippet,
            )
            for item in scraped_evidence
            if item.sentiment == "positive"
        )
        negative.extend(
            CounterpartySignal(
                label=item.label,
                source=item.source,
                severity=item.severity,
                sentiment="negative",
                evidence=item.snippet,
            )
            for item in scraped_evidence
            if item.sentiment == "negative"
        )
        neutral_count = len([item for item in scraped_evidence if item.sentiment == "neutral"])
        weighted_positive = mean([signal.severity for signal in positive]) if positive else 0.0
        weighted_negative = mean([signal.severity for signal in negative]) if negative else 0.0
        evidence_coverage = min(0.12, (len(scraped_evidence) + len(signals)) * 0.02)
        registry_bonus = 0.05 if neutral_count >= 2 else 0.0
        score = round(
            max(
                0.0,
                min(
                    100.0,
                    58
                    + (weighted_positive * 24)
                    - (weighted_negative * 34)
                    + ((evidence_coverage + registry_bonus) * 100),
                ),
            ),
            2,
        )
        rating = "strong" if score >= 75 else "moderate" if score >= 55 else "weak"

        summary = (
            f"{scraped_summary} Credibility is rated {rating} because the signal mix shows "
            f"{len(positive)} positive and {len(negative)} negative indicators, with "
            f"{neutral_count} neutral footprint signals."
        )
        framework = (
            "credibility = 58 + 24*avg_positive_signal - 34*avg_negative_signal + evidence_coverage + registry_bonus, "
            "clamped to [0,100]"
        )
        return ContractorCredibilityReport(
            score=score,
            rating=rating,
            summary=summary,
            positiveSignals=[f"{signal.label}: {signal.evidence or signal.source}" for signal in positive[:6]],
            negativeSignals=[f"{signal.label}: {signal.evidence or signal.source}" for signal in negative[:6]],
            sources=scraped_sources,
            framework=framework,
        )


party_intelligence_service = PartyIntelligenceService()
