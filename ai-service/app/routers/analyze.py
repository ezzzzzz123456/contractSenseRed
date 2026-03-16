from fastapi import APIRouter

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.contract_intelligence import contract_intelligence_service

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_contract(payload: AnalyzeRequest) -> AnalyzeResponse:
    return contract_intelligence_service.legacy_analyze(payload)
