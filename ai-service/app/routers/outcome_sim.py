from fastapi import APIRouter

from app.models.schemas import OutcomeSimRequest, OutcomeSimResponse
from app.services.contract_intelligence import contract_intelligence_service
from app.services.llm_service import llm_service

router = APIRouter()


@router.post("/outcome-sim", response_model=OutcomeSimResponse)
def simulate_outcome(payload: OutcomeSimRequest) -> OutcomeSimResponse:
    latest = payload.messages[-1].content if payload.messages else "No scenario provided."
    report = contract_intelligence_service.get_report(payload.contractId)
    citations = [clause.clauseId for clause in report.clauses[:3]] if report else ["Stored contract memory unavailable"]
    context = report.model_dump_json() if report else "No stored contract context available."
    reply = llm_service.simulate_outcome_with_context(context, latest)
    return OutcomeSimResponse(
        reply=reply,
        citations=citations,
        confidence=0.81 if report else 0.42,
    )
