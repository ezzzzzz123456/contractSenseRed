from fastapi import APIRouter

from app.models.schemas import CounterClauseRequest, CounterClauseResponse
from app.services.llm_service import llm_service

router = APIRouter()


@router.post("/counter-clause", response_model=CounterClauseResponse)
def generate_counter_clause(payload: CounterClauseRequest) -> CounterClauseResponse:
    suggestion, notes = llm_service.generate_counter_clause(payload.clauseText, payload.goal)
    return CounterClauseResponse(counterClauseSuggestion=suggestion, negotiationNotes=notes)

