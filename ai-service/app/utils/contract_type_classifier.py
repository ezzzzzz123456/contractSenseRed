from collections import Counter
import math
import re

from app.models.schemas import ContractTypePrediction


CONTRACT_TYPE_PROTOTYPES: dict[str, dict[str, float]] = {
    "legal statute": {"act": 2.1, "section": 1.8, "chapter": 1.4, "preamble": 1.2, "repealed": 1.0},
    "employment": {"employee": 2.0, "salary": 1.7, "benefits": 1.2, "termination": 0.9, "confidential": 0.5},
    "non-disclosure agreement": {"confidential": 2.0, "disclose": 1.6, "recipient": 1.2, "proprietary": 1.1, "nda": 2.5},
    "vendor agreement": {"purchase": 1.7, "vendor": 1.9, "delivery": 1.0, "goods": 1.3, "invoice": 0.8},
    "service contract": {"services": 1.9, "statement of work": 1.8, "fees": 1.1, "deliverables": 1.0, "client": 0.8},
    "consulting contract": {"consultant": 2.0, "advisory": 1.3, "milestones": 0.9, "independent contractor": 1.8},
    "partnership agreement": {"partner": 1.8, "profit": 1.3, "governance": 1.0, "capital contribution": 1.6},
    "rental agreement": {"rent": 2.0, "lease": 1.8, "tenant": 1.6, "premises": 1.2},
    "investment agreement": {"shares": 1.7, "investor": 2.0, "securities": 1.4, "closing": 0.9, "valuation": 1.0},
    "licensing contract": {"license": 2.0, "intellectual property": 1.7, "royalty": 1.5, "usage": 0.8},
}


def classify_contract_type(contract_text: str) -> str:
    return classify_contract_type_detailed(contract_text).category


def classify_contract_type_detailed(contract_text: str) -> ContractTypePrediction:
    lowered = contract_text.lower()
    tokens = re.findall(r"[a-zA-Z][a-zA-Z-]+", lowered)
    counts = Counter(tokens)
    scores: dict[str, float] = {}
    evidence: dict[str, list[str]] = {}

    for category, prototype in CONTRACT_TYPE_PROTOTYPES.items():
        raw = 0.0
        hits: list[str] = []
        for phrase, weight in prototype.items():
            phrase_hits = _count_phrase_hits(lowered, phrase)
            if phrase_hits:
                raw += weight * (1.0 + math.log1p(phrase_hits))
                hits.append(phrase)
        density_bonus = min(0.25, len(hits) / max(1.0, len(prototype) * 4.0))
        exclusivity = len(hits) / max(1, len(counts))
        scores[category] = raw + density_bonus + exclusivity
        evidence[category] = hits

    if not scores:
        return ContractTypePrediction(category="general", confidence=0.0)

    ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    top_category, top_score = ordered[0]
    runner_up_score = ordered[1][1] if len(ordered) > 1 else 0.0
    margin = max(0.0, top_score - runner_up_score)
    confidence = round(min(0.98, 0.42 + 0.18 * min(3.0, margin) + 0.06 * len(evidence[top_category])), 2)

    normalized_alternatives = {
        category: round(score / top_score, 2) if top_score else 0.0 for category, score in ordered[:4]
    }
    return ContractTypePrediction(
        category=top_category,
        confidence=confidence,
        evidence=evidence[top_category][:5],
        alternatives=normalized_alternatives,
    )


def _count_phrase_hits(text: str, phrase: str) -> int:
    if " " in phrase:
        pattern = rf"(?<![a-z]){re.escape(phrase)}(?![a-z])"
    else:
        pattern = rf"\b{re.escape(phrase)}\b"
    return len(re.findall(pattern, text))
