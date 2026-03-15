from fastapi import APIRouter

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.clause_detector import clause_detector
from app.services.llm_service import llm_service
from app.services.risk_scorer import risk_scorer
from app.utils.contract_type_classifier import classify_contract_type

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_contract(payload: AnalyzeRequest) -> AnalyzeResponse:
    clauses = clause_detector.detect_clauses(payload.contractText)
    flag_items = [risk_scorer.score_clause(clause) for clause in clauses]
    clause_models = [
        llm_service.build_clause(flag.text, flag.riskFlag)
        for flag in flag_items
    ]
    overall_risk = 80 if any(item.riskFlag == "red" for item in flag_items) else 35

    return AnalyzeResponse(
        contractType=payload.contractType or classify_contract_type(payload.contractText),
        summary="Automated contract review completed.",
        clauses=clause_models,
        overallRiskScore=overall_risk,
        recommendations=["Review high-risk clauses with counsel.", "Confirm key commercial terms."],
    )

