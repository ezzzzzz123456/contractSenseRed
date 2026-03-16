from datetime import datetime
import logging
import re
from uuid import uuid4

from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ClauseAnalysis,
    ClauseImprovement,
    ContractAnalysisReport,
    ContractAssistantQueryRequest,
    ContractAssistantQueryResponse,
    ContractIngestionRequest,
    ContractRiskMetrics,
    CourtroomAssessment,
    LegalScenario,
)
from app.services.clause_detector import clause_detector
from app.services.clause_segmenter import clause_segmenter
from app.services.contract_repository import contract_repository
from app.services.document_ingestion import document_ingestion_service
from app.services.llm_service import llm_service
from app.services.party_intelligence import party_intelligence_service
from app.services.risk_scorer import risk_scorer
from app.utils.contract_type_classifier import classify_contract_type_detailed


CLAUSE_TYPE_RULES = {
    "termination": ["terminate", "suspend", "renewal", "expiration"],
    "liability": ["liability", "indemn", "damages", "losses"],
    "payment": ["fees", "invoice", "payment", "interest"],
    "confidentiality": ["confidential", "proprietary", "non-disclosure"],
    "compliance": ["law", "regulation", "compliance", "data protection", "privacy"],
    "ip": ["intellectual property", "license", "ownership", "royalty"],
}
logger = logging.getLogger("contractsense.ingestion")
REFERENCE_PATTERN = re.compile(
    r"\b(?:section|clause|article|part|schedule)\s+([A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*)",
    re.IGNORECASE,
)


class ContractIntelligenceService:
    def analyze_contract(self, payload: ContractIngestionRequest) -> ContractAnalysisReport:
        contract_id = payload.contractId or f"contract-{uuid4().hex[:12]}"
        extracted_text, extraction_metadata, structured_document, ingestion_evaluation = document_ingestion_service.extract_with_structure(payload)
        contract_text = extracted_text.strip() or payload.contractText.strip()
        if not contract_text.strip():
            raise ValueError("Document ingestion produced no extracted text; downstream legal analysis was halted.")

        contract_prediction = classify_contract_type_detailed(
            contract_text if not payload.contractTypeHint else f"{payload.contractTypeHint}\n{contract_text}"
        )
        structured = llm_service.analyze_contract_payload(
            contract_text=contract_text,
            mime_type=payload.mediaType,
            base64_document=payload.documentBase64,
            contract_type_hint=payload.contractTypeHint,
        )
        clause_reports = self._build_clause_reports(contract_text, payload, structured)
        clause_reports = self._link_clause_context(clause_reports)

        aggregate = risk_scorer.aggregate_contract_scores(clause_reports)
        model_overall_risk = self._safe_number(structured.get("overallRiskScore")) if structured else None
        aggregated_overall_risk = float(aggregate["overallRiskScore"])
        overall_risk = max(model_overall_risk, aggregated_overall_risk) if model_overall_risk is not None else aggregated_overall_risk
        has_critical = any(clause.riskCategory == "critical" for clause in clause_reports)
        warning_count = len([clause for clause in clause_reports if clause.riskCategory == "warning"])
        if has_critical:
            overall_category = "critical"
        elif warning_count >= 2 or float(aggregate["p90ClauseRisk"]) >= 40:
            overall_category = "warning"
        else:
            overall_category = "warning" if overall_risk >= 32 else "safe"
        contractor_credibility = None
        if payload.parties:
            contractor_credibility = party_intelligence_service.analyze(
                payload.parties[-1],
                None,
                payload.publicSignals,
            )

        vulnerabilities = self._top_findings(clause_reports)
        loopholes = self._collect_unique([item for clause in clause_reports for item in clause.loopholes], limit=6)
        illegal_alerts = self._collect_unique([item for clause in clause_reports for item in clause.illegalSignals], limit=6)
        recommendations = self._collect_unique(
            [item for clause in clause_reports for item in clause.recommendations]
            + [
                "Validate any critical clause with jurisdiction-specific counsel before signature.",
                "Compare risk concentration against previous agreements in the contract memory store.",
            ],
            limit=8,
        )
        priority_actions = self._build_priority_actions(clause_reports, recommendations, structured)
        report_findings = self._build_report_findings(clause_reports, structured)
        if structured and isinstance(structured.get("summary"), str) and structured.get("summary"):
            summary = str(structured["summary"])
        else:
            summary = self._summarize_contract(contract_prediction.category, overall_category, clause_reports, contractor_credibility)
        executive_summary = self._executive_summary(clause_reports, overall_category, structured)

        if structured:
            model_contract_type = structured.get("contractType")
            if isinstance(model_contract_type, str) and model_contract_type.strip():
                contract_prediction.category = model_contract_type.strip()
            fairness_score = self._safe_number(structured.get("fairnessScore"))
            if fairness_score is not None:
                aggregate["fairnessIndex"] = max(0.0, min(100.0, fairness_score))

        report = ContractAnalysisReport(
            contractId=contract_id,
            contractType=contract_prediction,
            extraction=extraction_metadata,
            summary=summary,
            executiveLegalSummary=executive_summary,
            overallRiskScore=overall_risk,
            overallRiskCategory=overall_category,  # type: ignore[arg-type]
            keyVulnerabilities=vulnerabilities,
            legalLoopholes=loopholes,
            illegalClauseAlerts=illegal_alerts,
            recommendations=recommendations,
            priorityActions=priority_actions,
            reportFindings=report_findings,
            metrics=ContractRiskMetrics(**aggregate),
            clauses=clause_reports,
            documentStructure=structured_document,
            ingestionEvaluation=ingestion_evaluation,
            contractorCredibility=contractor_credibility,
            evaluationMetrics={
                "contract_classification": "top-1 accuracy, macro-F1, calibration error",
                "clause_segmentation": "boundary F1, hierarchical consistency, clause coverage",
                "risk_detection": "AUROC, precision@critical, weighted Brier score, explanation faithfulness",
                "explanation_quality": "human adequacy, factual consistency, edit distance to gold simplifications",
            },
            generatedAt=datetime.utcnow(),
        )
        searchable_text = "\n".join(
            [contract_text] + [f"{clause.originalText}\n{clause.plainLanguage}" for clause in clause_reports]
        )
        contract_repository.upsert_report(contract_id, report, searchable_text)
        return report

    def legacy_analyze(self, payload: AnalyzeRequest) -> AnalyzeResponse:
        report = self.analyze_contract(
            ContractIngestionRequest(
                contractId=payload.contractId,
                contractText=payload.contractText,
                parties=payload.parties,
                contractTypeHint=payload.contractType,
            )
        )
        legacy_clauses = [
            llm_service.build_clause(clause.originalText, clause.colorIndicator)
            for clause in report.clauses
        ]
        for legacy_clause, report_clause in zip(legacy_clauses, report.clauses):
            legacy_clause.explanation = report_clause.explanation
            legacy_clause.counterClauseSuggestion = report_clause.improvement.revisedClause

        return AnalyzeResponse(
            contractType=report.contractType.category,
            summary=report.summary,
            clauses=legacy_clauses,
            overallRiskScore=int(round(report.overallRiskScore)),
            recommendations=report.recommendations,
            report=report,
        )

    def assistant_query(self, payload: ContractAssistantQueryRequest) -> ContractAssistantQueryResponse:
        evidence = contract_repository.search(payload.question, payload.contractId, payload.topK)
        referenced_contracts = list(dict.fromkeys(item.contractId for item in evidence))
        if not evidence:
            return ContractAssistantQueryResponse(
                answer="No relevant analyzed clauses were found in contract memory for this question.",
                evidence=[],
                referencedContracts=[],
                confidence=0.18,
            )

        leading = evidence[0]
        answer = llm_service.simulate_outcome_with_context(
            "\n".join(item.snippet for item in evidence),
            payload.question,
        )
        confidence = round(min(0.95, 0.45 + 0.15 * len(evidence)), 2)
        return ContractAssistantQueryResponse(
            answer=answer,
            evidence=evidence,
            referencedContracts=referenced_contracts,
            confidence=confidence,
        )

    def get_report(self, contract_id: str) -> ContractAnalysisReport | None:
        record = contract_repository.get(contract_id)
        return record.report if record else None

    def _classify_clause_type(self, clause_text: str) -> str:
        lowered = clause_text.lower()
        for clause_type, keywords in CLAUSE_TYPE_RULES.items():
            if any(keyword in lowered for keyword in keywords):
                return clause_type
        if re.search(r"\bshall\b|\bmust\b", lowered):
            return "obligation"
        return "general"

    def _top_findings(self, clauses: list[ClauseAnalysis]) -> list[str]:
        ranked = sorted(clauses, key=lambda clause: clause.riskScore, reverse=True)
        findings: list[str] = []
        for clause in ranked[:4]:
            if clause.riskScore < 30:
                continue
            findings.append(
                f"{clause.clauseId}: {clause.courtroomAssessment.likelyRuling}"
            )
        return findings

    def _build_report_findings(self, clauses: list[ClauseAnalysis], structured: dict | None) -> list[str]:
        model_findings = structured.get("reportFindings") if structured else None
        if isinstance(model_findings, list):
            findings = [str(item).strip() for item in model_findings if str(item).strip()]
            if findings:
                return findings[:8]
        ranked = sorted(clauses, key=lambda clause: clause.riskScore, reverse=True)
        return [
            (
                f"{clause.sectionReference}: A judge is likely to view this as {clause.riskCategory} because "
                f"{clause.courtroomAssessment.judgeView.lower()}"
            )
            for clause in ranked[:5]
        ]

    def _build_priority_actions(
        self,
        clauses: list[ClauseAnalysis],
        recommendations: list[str],
        structured: dict | None,
    ) -> list[str]:
        model_actions = structured.get("priorityActions") if structured else None
        if isinstance(model_actions, list):
            actions = [str(item).strip() for item in model_actions if str(item).strip()]
            if actions:
                return actions[:6]
        highest = sorted(clauses, key=lambda clause: clause.riskScore, reverse=True)[:3]
        actions = [
            f"Redraft {clause.sectionReference} to address: {clause.courtroomAssessment.enforceabilityConcerns[0]}"
            for clause in highest
            if clause.courtroomAssessment.enforceabilityConcerns
        ]
        return self._collect_unique(actions + recommendations[:3], limit=6)

    def _collect_unique(self, items: list[str], limit: int) -> list[str]:
        ordered: list[str] = []
        for item in items:
            if item and item not in ordered:
                ordered.append(item)
            if len(ordered) >= limit:
                break
        return ordered

    def _summarize_contract(self, contract_type: str, overall_category: str, clauses: list[ClauseAnalysis], credibility) -> str:
        critical = len([clause for clause in clauses if clause.riskCategory == "critical"])
        warning = len([clause for clause in clauses if clause.riskCategory == "warning"])
        top_clause = max(clauses, key=lambda clause: clause.riskScore) if clauses else None
        credibility_note = ""
        if credibility is not None:
            credibility_note = f" Counterparty credibility is rated {credibility.rating} at {credibility.score:.0f}/100."
        risk_driver_note = ""
        if top_clause is not None:
            risk_driver_note = (
                f" The highest-risk issue is {top_clause.clauseType} language in {top_clause.clauseId}, "
                f"scored {top_clause.riskScore:.0f}/100."
            )
        return (
            f"This {contract_type} is assessed as {overall_category} risk, with {critical} critical clauses and {warning} warning clauses. "
            "The report prioritizes disproportionate liability, ambiguous drafting, loophole-prone overrides, and negotiable remediation paths."
            f"{risk_driver_note}"
            f"{credibility_note}"
        )

    def _executive_summary(self, clauses: list[ClauseAnalysis], overall_category: str, structured: dict | None) -> str:
        if structured:
            summary = str(structured.get("executiveLegalSummary") or "").strip()
            if summary:
                return summary
        ranked = sorted(clauses, key=lambda clause: clause.riskScore, reverse=True)[:3]
        if not ranked:
            return "The extracted document did not yield enough clause structure for a reliable executive legal summary."
        observations = " ".join(
            f"{clause.sectionReference}: {clause.courtroomAssessment.likelyRuling}"
            for clause in ranked
        )
        return (
            f"Overall legal posture is {overall_category}. "
            f"If disputed, the strongest litigation pressure points are: {observations}"
        )

    def _build_clause_reports(
        self,
        contract_text: str,
        payload: ContractIngestionRequest,
        structured: dict | None,
    ) -> list[ClauseAnalysis]:
        detected_segments = clause_segmenter.segment(contract_text)
        model_clauses = structured.get("clauses") if structured else None
        if isinstance(model_clauses, list) and model_clauses:
            if len(model_clauses) == 1 and len(detected_segments) >= 2:
                model_clauses = None
            elif len(detected_segments) >= 4 and len(model_clauses) < max(2, len(detected_segments) // 2):
                model_clauses = None
        if isinstance(model_clauses, list) and model_clauses:
            clause_reports: list[ClauseAnalysis] = []
            for index, item in enumerate(model_clauses, start=1):
                if not isinstance(item, dict):
                    continue
                original_text = str(item.get("originalText") or "").strip()
                if not original_text:
                    continue
                clause_id = str(item.get("id") or f"clause-{index:03d}")
                clause_type = self._classify_clause_type(original_text)
                base = self._seed_clause(
                    clause_id=clause_id,
                    original_text=original_text,
                    clause_type=clause_type,
                    payload=payload,
                    section_reference=str(item.get('sectionReference') or "Clause Review"),
                    title=str(item.get('title') or ""),
                )
                enriched = risk_scorer.analyze_clause(base)
                model_risk_score = self._safe_number(item.get("riskScore"))
                model_risk_level = str(item.get("riskLevel") or "").strip().lower()
                if model_risk_score is not None:
                    enriched.riskScore = max(enriched.riskScore, max(0.0, min(100.0, model_risk_score)))
                if model_risk_level in {"safe", "warning", "critical"}:
                    enriched.riskCategory = model_risk_level  # type: ignore[assignment]
                    enriched.colorIndicator = self._color_from_risk(model_risk_level)
                enriched.plainLanguage = str(item.get("simplifiedText") or enriched.plainLanguage)
                enriched.explanation = str(item.get("explanation") or enriched.explanation)
                enriched.recommendations = self._collect_unique(
                    [str(value).strip() for value in item.get("recommendations", []) if str(value).strip()]
                    + enriched.recommendations,
                    limit=6,
                )
                enriched.loopholes = self._collect_unique(
                    [str(value).strip() for value in item.get("loopholes", []) if str(value).strip()]
                    + enriched.loopholes,
                    limit=5,
                )
                enriched.illegalSignals = self._collect_unique(
                    [str(value).strip() for value in item.get("illegalSignals", []) if str(value).strip()]
                    + enriched.illegalSignals,
                    limit=5,
                )
                suggested_revision = str(item.get("suggestedRevision") or "").strip()
                if suggested_revision:
                    enriched.improvement = ClauseImprovement(
                        originalClause=original_text,
                        revisedClause=suggested_revision,
                        justification="Revision generated from Gemini contract analysis.",
                    )
                negotiation_text = str(item.get("negotiationStrategy") or "").strip()
                if negotiation_text:
                    enriched.negotiation = llm_service.negotiation_strategy(
                        original_text,
                        payload.requestedTone,
                        enriched.recommendations,
                    )
                    enriched.negotiation.draftedResponse = negotiation_text
                legal_simulation = str(item.get("legalSimulation") or "").strip()
                claimant_arguments = [str(value).strip() for value in item.get("claimantArguments", []) if str(value).strip()]
                defense_arguments = [str(value).strip() for value in item.get("defenseArguments", []) if str(value).strip()]
                enforceability_concerns = [str(value).strip() for value in item.get("enforceabilityConcerns", []) if str(value).strip()]
                judge_view = str(item.get("judgeView") or "").strip()
                likely_ruling = str(item.get("likelyRuling") or "").strip()
                business_impact = str(item.get("businessImpact") or "").strip()
                if legal_simulation:
                    enriched.legalScenarios = [
                        LegalScenario(
                            scenario=f"Dispute over {enriched.sectionReference}",
                            likelyConsequence=legal_simulation,
                            severity=enriched.riskCategory,
                            reasoning=judge_view or enriched.explanation,
                        )
                    ]
                enriched.courtroomAssessment = CourtroomAssessment(
                    judgeView=judge_view or enriched.explanation,
                    claimantArguments=claimant_arguments,
                    defenseArguments=defense_arguments,
                    likelyRuling=likely_ruling or f"A court is likely to treat this clause as {enriched.riskCategory}.",
                    enforceabilityConcerns=enforceability_concerns,
                    businessImpact=business_impact or "This clause may shift leverage during performance disputes.",
                )
                if not claimant_arguments or not defense_arguments or not enforceability_concerns or not legal_simulation:
                    enriched = self._apply_fallback_legal_reasoning(enriched)
                clause_reports.append(enriched)
            if clause_reports:
                return clause_reports

        fallback_reports: list[ClauseAnalysis] = []
        for segment in detected_segments:
            clause_type = self._classify_clause_type(segment.originalText)
            seeded = self._seed_clause(
                clause_id=segment.clauseId,
                original_text=segment.originalText,
                clause_type=clause_type,
                payload=payload,
                section_reference=segment.sectionReference,
                hierarchy=segment.hierarchy,
                title=segment.title,
            )
            enriched = risk_scorer.analyze_clause(seeded)
            enriched.improvement = llm_service.improve_clause(segment.originalText, "reduce legal and commercial asymmetry")
            enriched.negotiation = llm_service.negotiation_strategy(segment.originalText, payload.requestedTone, enriched.recommendations)
            enriched = self._apply_fallback_legal_reasoning(enriched)
            fallback_reports.append(enriched)
        return fallback_reports

    def _apply_fallback_legal_reasoning(self, clause: ClauseAnalysis) -> ClauseAnalysis:
        lowered = clause.originalText.lower()
        clause.courtroomAssessment = CourtroomAssessment(
            judgeView=self._judge_view(clause),
            claimantArguments=self._claimant_arguments(clause),
            defenseArguments=self._defense_arguments(clause),
            likelyRuling=self._likely_ruling(clause),
            enforceabilityConcerns=self._enforceability_concerns(clause),
            businessImpact=self._business_impact(clause),
        )
        if not clause.legalScenarios:
            clause.legalScenarios = [
                LegalScenario(
                    scenario=f"Dispute over {clause.sectionReference}",
                    likelyConsequence=self._likely_consequence(clause, lowered),
                    severity=clause.riskCategory,
                    reasoning=clause.courtroomAssessment.judgeView,
                )
            ]
        return clause

    def _judge_view(self, clause: ClauseAnalysis) -> str:
        if clause.riskCategory == "critical":
            return (
                f"A judge is likely to read this {clause.clauseType} clause as heavily one-sided because "
                f"{clause.explanation.lower()}"
            )
        if clause.riskCategory == "warning":
            return (
                f"A judge may enforce the clause narrowly, but only after testing ambiguity, notice, scope, and proportionality."
            )
        return "A judge is likely to treat this clause as commercially standard unless surrounding facts make enforcement unfair."

    def _claimant_arguments(self, clause: ClauseAnalysis) -> list[str]:
        items = [
            "The wording should be enforced as written because the parties accepted a clear allocation of risk.",
        ]
        lowered = clause.originalText.lower()
        if "indemn" in lowered:
            items.append("The indemnity language is broad enough to shift defense costs and third-party claim exposure immediately.")
        if "terminate" in lowered:
            items.append("The termination trigger was activated under the contract text, so the claimant may exit without further cure.")
        if "interest" in lowered or "late" in lowered:
            items.append("Late-payment language creates a contractual right to collect default interest and recovery costs.")
        return items[:3]

    def _defense_arguments(self, clause: ClauseAnalysis) -> list[str]:
        items = [
            "Any ambiguous wording should be construed narrowly, especially if one party drafted the clause.",
        ]
        if clause.loopholes:
            items.append(f"The clause contains a drafting weakness: {clause.loopholes[0]}")
        if clause.illegalSignals:
            items.append(f"Enforcement may be limited because {clause.illegalSignals[0].lower()}")
        elif clause.riskBreakdown.fairnessImbalance >= 0.45:
            items.append("The clause is disproportionate and may be softened to avoid an unfair or punitive result.")
        return items[:3]

    def _likely_ruling(self, clause: ClauseAnalysis) -> str:
        lowered = clause.originalText.lower()
        if "indemn" in lowered:
            return "A court is likely to enforce indemnity only to the extent the scope is clear, causation is proven, and the loss category fits the clause."
        if "terminate" in lowered:
            return "A court will likely ask whether notice, cure rights, and the stated trigger were actually satisfied before upholding termination."
        if "interest" in lowered or "late" in lowered:
            return "A court is likely to award late-payment remedies only if the rate is lawful, conspicuous, and tied to an undisputed default."
        if clause.riskCategory == "critical":
            return "A court may partially enforce the clause but is likely to narrow the harshest reading to avoid disproportionate exposure."
        if clause.riskCategory == "warning":
            return "A court would likely enforce the commercial core of the clause while trimming ambiguous or overreaching edges."
        return "A court is likely to enforce the clause substantially as drafted."

    def _enforceability_concerns(self, clause: ClauseAnalysis) -> list[str]:
        concerns = list(clause.illegalSignals[:2]) + list(clause.loopholes[:2])
        if clause.riskBreakdown.ambiguity >= 0.34:
            concerns.append("Undefined standards or vague triggers create room for judicial narrowing.")
        if clause.riskBreakdown.fairnessImbalance >= 0.45:
            concerns.append("A one-sided risk allocation could be challenged as commercially unreasonable.")
        if clause.riskBreakdown.penaltySeverity >= 0.34:
            concerns.append("Penalty-like economics may face scrutiny if they exceed compensatory loss.")
        return self._collect_unique(concerns, limit=4)

    def _business_impact(self, clause: ClauseAnalysis) -> str:
        if clause.clauseType == "liability":
            return "This clause can decide who pays defense costs, settlement pressure, and uncovered losses once a dispute starts."
        if clause.clauseType == "termination":
            return "This clause controls leverage at the moment of operational failure, suspension, or exit."
        if clause.clauseType == "payment":
            return "This clause affects cash flow pressure, invoice disputes, and the cost of delay."
        return "This clause shapes dispute leverage, drafting clarity, and the cost of enforcement."

    def _likely_consequence(self, clause: ClauseAnalysis, lowered: str) -> str:
        if "indemn" in lowered:
            return "If a claim is filed, the indemnifying party may face immediate pressure to fund legal defense and absorb settlement exposure."
        if "terminate" in lowered:
            return "If invoked, this clause may justify rapid exit, service interruption, and a fight over whether the trigger was valid."
        if "interest" in lowered or "late" in lowered:
            return "A payment dispute may escalate into interest accrual, collection costs, and suspension leverage."
        return "If disputed, this clause may increase negotiation cost because each side can argue for a different reading."

    def _seed_clause(
        self,
        clause_id: str,
        original_text: str,
        clause_type: str,
        payload: ContractIngestionRequest,
        section_reference: str = "Clause Review",
        hierarchy: list[str] | None = None,
        title: str = "",
    ) -> ClauseAnalysis:
        plain_language = llm_service.simplify_clause(original_text)
        return ClauseAnalysis(
            clauseId=clause_id,
            sectionReference=section_reference,
            hierarchy=hierarchy or [section_reference],
            title=title,
            originalText=original_text,
            plainLanguage=plain_language,
            clauseType=clause_type,
            riskCategory="safe",
            colorIndicator="green",
            riskScore=0.0,
            confidence=0.0,
            explanation="Pending analysis.",
            riskBreakdown={
                "obligationAsymmetry": 0.0,
                "liabilityExposure": 0.0,
                "ambiguity": 0.0,
                "penaltySeverity": 0.0,
                "terminationVolatility": 0.0,
                "complianceExposure": 0.0,
                "loopholeExposure": 0.0,
                "fairnessImbalance": 0.0,
                "score": 0.0,
                "confidence": 0.0,
                "formula": "",
            },
            loopholes=[],
            illegalSignals=[],
            recommendations=[],
            improvement=ClauseImprovement(
                originalClause=original_text,
                revisedClause=original_text,
                justification="Pending improvement generation.",
            ),
            negotiation=llm_service.negotiation_strategy(original_text, payload.requestedTone, []),
            legalScenarios=[],
            courtroomAssessment=CourtroomAssessment(
                judgeView="Judicial assessment pending deeper legal analysis.",
                claimantArguments=[],
                defenseArguments=[],
                likelyRuling="A likely ruling will be estimated after clause-level analysis completes.",
                enforceabilityConcerns=[],
                businessImpact="Business impact will be estimated after clause-level analysis completes.",
            ),
            linkedClauseIds=[],
            crossReferences=[],
            contextSummary="",
        )

    def _safe_number(self, value) -> float | None:
        if isinstance(value, (int, float)):
            return float(value)
        try:
            return float(str(value))
        except Exception:
            return None

    def _color_from_risk(self, risk_level: str) -> str:
        return {"critical": "red", "warning": "yellow", "safe": "green"}[risk_level]

    def _link_clause_context(self, clauses: list[ClauseAnalysis]) -> list[ClauseAnalysis]:
        if not clauses:
            return clauses

        reference_index = self._build_reference_index(clauses)
        for index, clause in enumerate(clauses):
            references = self._extract_cross_references(clause.originalText)
            linked_ids: list[str] = []
            related_texts: list[str] = []

            for reference in references:
                for linked_clause in reference_index.get(reference.lower(), []):
                    if linked_clause.clauseId == clause.clauseId:
                        continue
                    if linked_clause.clauseId not in linked_ids:
                        linked_ids.append(linked_clause.clauseId)
                        related_texts.append(linked_clause.originalText)

            if index > 0:
                linked_ids.append(clauses[index - 1].clauseId)
                related_texts.append(clauses[index - 1].originalText)
            if index + 1 < len(clauses):
                linked_ids.append(clauses[index + 1].clauseId)
                related_texts.append(clauses[index + 1].originalText)

            deduped_ids: list[str] = []
            deduped_related: list[str] = []
            seen_texts: set[str] = set()
            for linked_id, related_text in zip(linked_ids, related_texts):
                if linked_id not in deduped_ids:
                    deduped_ids.append(linked_id)
                if related_text not in seen_texts:
                    seen_texts.add(related_text)
                    deduped_related.append(related_text)

            clause.linkedClauseIds = deduped_ids[:6]
            clause.crossReferences = references[:6]
            clause.contextSummary = self._build_context_summary(clause, deduped_ids, references)
            clause = risk_scorer.contextualize_clause(clause, deduped_related[:4], references)
            clause = self._apply_contextual_legal_reasoning(clause, deduped_ids, references)
            clauses[index] = clause
        return clauses

    def _build_reference_index(self, clauses: list[ClauseAnalysis]) -> dict[str, list[ClauseAnalysis]]:
        index: dict[str, list[ClauseAnalysis]] = {}
        for clause in clauses:
            keys = {
                clause.clauseId.lower(),
                clause.sectionReference.lower(),
                clause.title.lower(),
            }
            for item in clause.hierarchy:
                if item:
                    keys.add(item.lower())
                    suffix = item.split()[-1].strip(":.").lower()
                    if suffix:
                        keys.add(suffix)
            numbered = re.match(r"^(\d+(?:\.\d+)*)", clause.originalText.strip())
            if numbered:
                keys.add(numbered.group(1).lower())
            for key in keys:
                if key and key not in {"general", "clause review"}:
                    index.setdefault(key, []).append(clause)
        return index

    def _extract_cross_references(self, text: str) -> list[str]:
        refs = [match.group(1).strip() for match in REFERENCE_PATTERN.finditer(text)]
        ordered: list[str] = []
        for ref in refs:
            if ref not in ordered:
                ordered.append(ref)
        return ordered

    def _build_context_summary(self, clause: ClauseAnalysis, linked_ids: list[str], references: list[str]) -> str:
        parts: list[str] = []
        if references:
            parts.append(f"References: {', '.join(references[:4])}.")
        if linked_ids:
            parts.append(f"Related clauses: {', '.join(linked_ids[:4])}.")
        if not parts:
            parts.append("Primary context comes from adjacent clauses in the document flow.")
        return " ".join(parts)

    def _apply_contextual_legal_reasoning(
        self,
        clause: ClauseAnalysis,
        linked_ids: list[str],
        references: list[str],
    ) -> ClauseAnalysis:
        if not linked_ids and not references:
            return clause

        context_sentence = clause.contextSummary or "This clause should be read with surrounding clauses."
        clause.courtroomAssessment.judgeView = (
            f"{clause.courtroomAssessment.judgeView} Contextually, {context_sentence.lower()}"
        )
        clause.courtroomAssessment.likelyRuling = (
            f"{clause.courtroomAssessment.likelyRuling} A court would read it together with {len(linked_ids) or 'nearby'} related clause(s)."
        )
        clause.courtroomAssessment.businessImpact = (
            f"{clause.courtroomAssessment.businessImpact} Cross-clause interaction can change who has leverage if a dispute arises."
        )
        clause.courtroomAssessment.enforceabilityConcerns = self._collect_unique(
            clause.courtroomAssessment.enforceabilityConcerns + [
                "Linked clauses may alter scope, remedies, or priority if they are not harmonized."
            ],
            limit=5,
        )
        return clause


contract_intelligence_service = ContractIntelligenceService()
