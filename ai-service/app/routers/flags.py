from fastapi import APIRouter

from app.models.schemas import FlagsRequest, FlagsResponse
from app.services.risk_scorer import risk_scorer

router = APIRouter()


@router.post("/flags", response_model=FlagsResponse)
def get_flags(payload: FlagsRequest) -> FlagsResponse:
    return FlagsResponse(flags=[risk_scorer.score_clause(clause) for clause in payload.clauses])

