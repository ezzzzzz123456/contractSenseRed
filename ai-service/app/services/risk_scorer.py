import math
import re
from statistics import mean

from app.models.schemas import ClauseAnalysis, FlagItem, LegalScenario, RiskMetricBreakdown


class RiskScorerService:
    METRIC_WEIGHTS = {
        "obligationAsymmetry": 0.15,
        "liabilityExposure": 0.22,
        "ambiguity": 0.10,
        "penaltySeverity": 0.13,
        "terminationVolatility": 0.12,
        "complianceExposure": 0.11,
        "loopholeExposure": 0.07,
        "fairnessImbalance": 0.10,
    }

    def score_clause(self, clause_text: str) -> FlagItem:
        analysis = self.analyze_clause_text(clause_text)
        return FlagItem(
            text=clause_text,
            riskFlag=analysis["color"],
            explanation=analysis["explanation"],
        )

    def analyze_clause_text(self, clause_text: str) -> dict[str, object]:
        lowered = clause_text.lower()
        trigger_map = self._collect_triggers(lowered)
        metrics = {
            "obligationAsymmetry": self._bounded_metric(lowered, ["sole discretion", "at its discretion", "must", "shall", "owned exclusively", "work made for hire"], 4),
            "liabilityExposure": self._trigger_ratio(trigger_map, ["indemnity", "defense_costs", "all_claims", "uncapped", "liability"], 3),
            "ambiguity": self._bounded_metric(lowered, ["reasonable efforts", "material", "promptly", "as needed", "best efforts", "commercially reasonable"], 4),
            "penaltySeverity": self._trigger_ratio(trigger_map, ["late_fee", "interest_charge", "legal_fees", "liquidated_damages", "withhold_payment"], 3),
            "terminationVolatility": self._trigger_ratio(trigger_map, ["termination", "immediate_termination", "termination_for_convenience"], 3),
            "complianceExposure": self._bounded_metric(lowered, ["law", "regulation", "gdpr", "anti-bribery", "sanction"], 5),
            "loopholeExposure": self._bounded_metric(lowered, ["notwithstanding", "except as otherwise", "deemed accepted", "waive"], 4),
            "fairnessImbalance": self._fairness_metric(lowered, trigger_map),
        }

        weighted = sum(metrics[name] * weight for name, weight in self.METRIC_WEIGHTS.items())
        interaction = 0.12 if metrics["liabilityExposure"] > 0.45 and metrics["terminationVolatility"] > 0.4 else 0.0
        escalation = 0.08 if metrics["ambiguity"] > 0.45 and metrics["loopholeExposure"] > 0.45 else 0.0
        trigger_bonus = min(0.18, 0.04 * sum(trigger_map.values()))
        raw_score = min(1.0, weighted + interaction + escalation + trigger_bonus)
        score = round(100.0 * math.sqrt(raw_score), 2)
        confidence = round(min(0.97, 0.45 + 0.1 * len([value for value in metrics.values() if value > 0.15]) + min(len(clause_text) / 800.0, 0.25)), 2)

        if score >= 55:
            category = "critical"
            color = "red"
        elif score >= 28:
            category = "warning"
            color = "yellow"
        else:
            category = "safe"
            color = "green"

        illegal_signals = self._illegal_signals(lowered)
        loopholes = self._loopholes(lowered)
        explanation = self._explain_clause(score, category, metrics, illegal_signals, loopholes)

        breakdown = RiskMetricBreakdown(
            obligationAsymmetry=metrics["obligationAsymmetry"],
            liabilityExposure=metrics["liabilityExposure"],
            ambiguity=metrics["ambiguity"],
            penaltySeverity=metrics["penaltySeverity"],
            terminationVolatility=metrics["terminationVolatility"],
            complianceExposure=metrics["complianceExposure"],
            loopholeExposure=metrics["loopholeExposure"],
            fairnessImbalance=metrics["fairnessImbalance"],
            score=score,
            confidence=confidence,
            formula=(
                "score = 100 * sqrt(sum(weight_i * metric_i) + interaction_penalty + ambiguity_loophole_penalty), "
                "with metrics normalized to [0,1]"
            ),
        )
        recommendations = self._recommendations(metrics, illegal_signals, loopholes, trigger_map)
        scenarios = self._scenarios(lowered, category, trigger_map)

        return {
            "score": score,
            "confidence": confidence,
            "category": category,
            "color": color,
            "breakdown": breakdown,
            "illegal_signals": illegal_signals,
            "loopholes": loopholes,
            "explanation": explanation,
            "recommendations": recommendations,
            "scenarios": scenarios,
        }

    def analyze_clause(self, clause: ClauseAnalysis) -> ClauseAnalysis:
        result = self.analyze_clause_text(clause.originalText)
        clause.riskCategory = result["category"]  # type: ignore[assignment]
        clause.colorIndicator = result["color"]  # type: ignore[assignment]
        clause.riskScore = result["score"]  # type: ignore[assignment]
        clause.confidence = result["confidence"]  # type: ignore[assignment]
        clause.explanation = result["explanation"]  # type: ignore[assignment]
        clause.riskBreakdown = result["breakdown"]  # type: ignore[assignment]
        clause.loopholes = result["loopholes"]  # type: ignore[assignment]
        clause.illegalSignals = result["illegal_signals"]  # type: ignore[assignment]
        clause.recommendations = result["recommendations"]  # type: ignore[assignment]
        clause.legalScenarios = result["scenarios"]  # type: ignore[assignment]
        return clause

    def aggregate_contract_scores(self, clauses: list[ClauseAnalysis]) -> dict[str, float | str]:
        scores = [clause.riskScore for clause in clauses] or [0.0]
        fairness_values = [1.0 - clause.riskBreakdown.fairnessImbalance for clause in clauses] or [1.0]
        legal_exposure_values = [mean([clause.riskBreakdown.complianceExposure, clause.riskBreakdown.liabilityExposure]) for clause in clauses] or [0.0]
        critical_ratio = len([score for score in scores if score >= 55]) / len(scores)
        warning_ratio = len([score for score in scores if 28 <= score < 55]) / len(scores)
        mean_score = round(mean(scores), 2)
        p90_score = round(sorted(scores)[max(0, math.ceil(len(scores) * 0.9) - 1)], 2)
        dispersion = round(min(1.0, (max(scores) - min(scores)) / 100.0), 2)
        concentration_index = round(min(100.0, 100.0 * (0.6 * critical_ratio + 0.4 * dispersion)), 2)
        fairness_index = round(100.0 * mean(fairness_values), 2)
        legal_exposure_index = round(100.0 * mean(legal_exposure_values), 2)
        overall = round(
            0.45 * mean_score
            + 0.25 * p90_score
            + 0.15 * (critical_ratio * 100.0)
            + 0.1 * (warning_ratio * 100.0)
            + 0.05 * legal_exposure_index,
            2,
        )
        return {
            "overallRiskScore": min(100.0, overall),
            "meanClauseRisk": mean_score,
            "p90ClauseRisk": p90_score,
            "criticalClauseRatio": round(critical_ratio, 2),
            "warningClauseRatio": round(warning_ratio, 2),
            "riskDispersion": dispersion,
            "fairnessIndex": fairness_index,
            "legalExposureIndex": legal_exposure_index,
            "concentrationIndex": concentration_index,
            "aggregationFormula": (
                "overall = 0.55*mean_clause_risk + 0.20*p90_clause_risk + "
                "0.15*critical_clause_ratio*100 + 0.10*legal_exposure_index"
            ),
        }

    def _bounded_metric(self, text: str, phrases: list[str], denominator: int) -> float:
        hits = sum(1 for phrase in phrases if phrase in text)
        return round(min(1.0, hits / max(1, denominator)), 2)

    def _fairness_metric(self, text: str, trigger_map: dict[str, int]) -> float:
        burden_terms = sum(1 for phrase in ["solely responsible", "at its own cost", "waive", "indemnify", "owned exclusively"] if phrase in text)
        balance_terms = sum(1 for phrase in ["mutual", "reasonable", "proportionate", "subject to", "either party"] if phrase in text)
        one_sided_bonus = 0.14 if trigger_map.get("one_sided_termination", 0) else 0.0
        score = min(1.0, max(0.0, 0.12 + burden_terms * 0.18 + one_sided_bonus - balance_terms * 0.1))
        return round(score, 2)

    def _illegal_signals(self, text: str) -> list[str]:
        signals: list[str] = []
        if "waive all rights" in text or "non-compete" in text and "worldwide" in text:
            signals.append("Potentially unenforceable rights waiver or overbroad restraint language.")
        if "bribe" in text or "facilitation payment" in text:
            signals.append("Possible anti-corruption violation language.")
        if "process personal data" in text and "without consent" in text:
            signals.append("Potential privacy-law non-compliance.")
        return signals

    def _loopholes(self, text: str) -> list[str]:
        loopholes: list[str] = []
        if "deemed accepted" in text and "days" not in text:
            loopholes.append("Deemed acceptance without a fixed review period can be exploited.")
        if "notwithstanding anything" in text:
            loopholes.append("Override drafting may neutralize otherwise protective clauses.")
        if re.search(r"\bmay\b", text) and "sole discretion" in text:
            loopholes.append("Discretionary language leaves room for unilateral interpretation.")
        return loopholes

    def _recommendations(
        self,
        metrics: dict[str, float],
        illegal_signals: list[str],
        loopholes: list[str],
        trigger_map: dict[str, int],
    ) -> list[str]:
        items: list[str] = []
        if metrics["liabilityExposure"] >= 0.34:
            items.append("Cap liability and exclude indirect or unforeseeable damages.")
        if metrics["terminationVolatility"] >= 0.34:
            items.append("Require notice, cure rights, and a defined termination trigger.")
        if metrics["ambiguity"] >= 0.34:
            items.append("Define vague standards, deadlines, and performance thresholds.")
        if trigger_map.get("indemnity", 0):
            items.append("Limit indemnity to third-party claims caused by the supplier's proven fault.")
        if trigger_map.get("interest_charge", 0):
            items.append("Reduce late-payment interest or add a grace period before default charges apply.")
        if trigger_map.get("exclusive_ip", 0):
            items.append("Clarify ownership carve-outs for pre-existing IP, tools, and reusable know-how.")
        if illegal_signals:
            items.append("Run specialist legal review for enforceability and regulatory compliance.")
        if loopholes:
            items.append("Close drafting loopholes with fixed triggers and explicit exceptions.")
        return items or ["No material risk remediation identified beyond standard legal review."]

    def _scenarios(self, text: str, category: str, trigger_map: dict[str, int]) -> list[LegalScenario]:
        severity = "critical" if category == "critical" else "warning"
        scenarios: list[LegalScenario] = []
        if "terminate" in text:
            scenarios.append(
                LegalScenario(
                    scenario="Counterparty triggers termination",
                    likelyConsequence="Service disruption, accelerated transition costs, and leverage loss in negotiations.",
                    severity=severity,  # type: ignore[arg-type]
                    reasoning="Termination language can be used as pressure if triggers or cure rights are under-defined.",
                )
            )
        if "indemn" in text or "liability" in text:
            scenarios.append(
                LegalScenario(
                    scenario="Third-party claim or service failure",
                    likelyConsequence="The clause may transfer defense costs and damages disproportionately.",
                    severity=severity,  # type: ignore[arg-type]
                    reasoning="Liability and indemnity drafting determines who funds disputes and uncapped losses.",
                )
            )
        if trigger_map.get("interest_charge", 0):
            scenarios.append(
                LegalScenario(
                    scenario="Late payment dispute escalates",
                    likelyConsequence="Interest, collection costs, or suspension rights can increase the effective contract price.",
                    severity="warning",
                    reasoning="Default-rate clauses become leverage points once an invoice is contested or delayed.",
                )
            )
        if not scenarios:
            scenarios.append(
                LegalScenario(
                    scenario="Routine operational dispute",
                    likelyConsequence="Ambiguous drafting can extend resolution timelines and increase negotiation costs.",
                    severity="warning",
                    reasoning="Even non-critical clauses become expensive when key obligations are vague.",
                )
            )
        return scenarios

    def _explain_clause(
        self,
        score: float,
        category: str,
        metrics: dict[str, float],
        illegal_signals: list[str],
        loopholes: list[str],
    ) -> str:
        top_driver = max(metrics, key=metrics.get)
        message = (
            f"Clause risk is {category} with score {score:.2f}. "
            f"The strongest driver is {top_driver}, and the clause shows elevated exposure where obligations may be hard to contest or limit."
        )
        if illegal_signals:
            message += " Potential illegality signals are present."
        if loopholes:
            message += " Drafting loopholes may allow opportunistic interpretation."
        return message

    def _trigger_ratio(self, trigger_map: dict[str, int], keys: list[str], denominator: int) -> float:
        hits = sum(trigger_map.get(key, 0) for key in keys)
        return round(min(1.0, hits / max(1, denominator)), 2)

    def _collect_triggers(self, text: str) -> dict[str, int]:
        return {
            "indemnity": int(bool(re.search(r"\bindemnif(y|ies|ication)\b", text))),
            "defense_costs": int(bool(re.search(r"\bdefend\b|\blegal fees?\b", text))),
            "all_claims": int(bool(re.search(r"\ball (lawsuits|claims|costs|losses)\b", text))),
            "uncapped": int(bool(re.search(r"\bunlimited liability\b|\ball losses\b", text))),
            "liability": int(bool(re.search(r"\bliabilit(y|ies)\b", text))),
            "late_fee": int(bool(re.search(r"\blate payments?\b|\blate fee\b", text))),
            "interest_charge": int(bool(re.search(r"\binterest\b|\b1\.5%\b|\bper month\b", text))),
            "legal_fees": int(bool(re.search(r"\blegal fees?\b|\battorneys'? fees?\b", text))),
            "liquidated_damages": int(bool(re.search(r"\bliquidated damages?\b|\bpenalt(y|ies)\b", text))),
            "withhold_payment": int(bool(re.search(r"\bwithhold payment\b|\bset off\b", text))),
            "termination": int(bool(re.search(r"\bterminate\b|\btermination\b", text))),
            "immediate_termination": int(bool(re.search(r"\bimmediately\b|\bimmediate termination\b", text))),
            "termination_for_convenience": int(bool(re.search(r"\bfor any reason\b|\bfor convenience\b", text))),
            "one_sided_termination": int(bool(re.search(r"\b(company|client|buyer)\b.*\bmay terminate\b", text) and not re.search(r"\beither party\b", text))),
            "exclusive_ip": int(bool(re.search(r"\bowned exclusively\b|\bwork made for hire\b", text))),
        }


risk_scorer = RiskScorerService()
