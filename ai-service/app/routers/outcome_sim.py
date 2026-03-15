from fastapi import APIRouter

from app.models.schemas import OutcomeSimRequest, OutcomeSimResponse
from app.services.llm_service import llm_service

router = APIRouter()


@router.post("/outcome-sim", response_model=OutcomeSimResponse)
def simulate_outcome(payload: OutcomeSimRequest) -> OutcomeSimResponse:
    latest = payload.messages[-1].content if payload.messages else "No scenario provided."
    return OutcomeSimResponse(
        reply=llm_service.simulate_outcome(latest),
        citations=["Termination clause", "Payment terms"],
        confidence=0.74,
    )

