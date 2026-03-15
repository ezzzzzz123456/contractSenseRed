from fastapi import APIRouter

from app.models.schemas import PartyIntelRequest, PartyIntelResponse
from app.services.llm_service import llm_service
from app.services.scraper_service import scraper_service

router = APIRouter()


@router.post("/party-intel", response_model=PartyIntelResponse)
def get_party_intelligence(payload: PartyIntelRequest) -> PartyIntelResponse:
    summary, sources = scraper_service.summarize_counterparty(
        payload.partyName,
        str(payload.website) if payload.website else None,
    )
    return PartyIntelResponse(
        partyName=payload.partyName,
        summary=f"{summary} {llm_service.summarize_party(payload.partyName)}",
        riskIndicators=["Reputation review recommended.", "Validate payment history during onboarding."],
        sources=sources,
    )

