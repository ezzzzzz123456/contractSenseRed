from fastapi import APIRouter

from app.models.schemas import CounterpartySignal, PartyIntelRequest, PartyIntelResponse
from app.services.llm_service import llm_service
from app.services.party_intelligence import party_intelligence_service

router = APIRouter()


@router.post("/party-intel", response_model=PartyIntelResponse)
def get_party_intelligence(payload: PartyIntelRequest) -> PartyIntelResponse:
    signals = [CounterpartySignal(label=signal, sentiment="neutral") for signal in payload.publicSignals]
    report = party_intelligence_service.analyze(
        payload.partyName,
        str(payload.website) if payload.website else None,
        signals,
    )
    return PartyIntelResponse(
        partyName=payload.partyName,
        summary=f"{report.summary} {llm_service.summarize_party(payload.partyName, report.score)}",
        riskIndicators=report.negativeSignals or ["Reputation review recommended.", "Validate payment history during onboarding."],
        sources=report.sources,
        credibilityScore=report.score,
    )
