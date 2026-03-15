from fastapi import APIRouter

from app.models.schemas import SimplifyRequest, SimplifyResponse
from app.services.llm_service import llm_service

router = APIRouter()


@router.post("/simplify", response_model=SimplifyResponse)
def simplify_clause(payload: SimplifyRequest) -> SimplifyResponse:
    return SimplifyResponse(simplifiedText=llm_service.simplify_clause(payload.clauseText))

