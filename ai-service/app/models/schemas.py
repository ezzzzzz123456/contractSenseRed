from typing import Literal

from pydantic import BaseModel, HttpUrl


RiskFlag = Literal["red", "yellow", "green"]


class ClauseModel(BaseModel):
    text: str
    simplifiedText: str
    riskFlag: RiskFlag
    explanation: str
    counterClauseSuggestion: str


class AnalyzeRequest(BaseModel):
    contractId: str
    contractText: str
    contractType: str
    parties: list[str] = []


class AnalyzeResponse(BaseModel):
    contractType: str
    summary: str
    clauses: list[ClauseModel]
    overallRiskScore: int
    recommendations: list[str]


class SimplifyRequest(BaseModel):
    clauseText: str
    context: str = ""


class SimplifyResponse(BaseModel):
    simplifiedText: str


class FlagsRequest(BaseModel):
    clauses: list[str]


class FlagItem(BaseModel):
    text: str
    riskFlag: RiskFlag
    explanation: str


class FlagsResponse(BaseModel):
    flags: list[FlagItem]


class CounterClauseRequest(BaseModel):
    clauseText: str
    goal: str


class CounterClauseResponse(BaseModel):
    counterClauseSuggestion: str
    negotiationNotes: list[str]


class PartyIntelRequest(BaseModel):
    partyName: str
    website: HttpUrl | None = None


class PartyIntelResponse(BaseModel):
    partyName: str
    summary: str
    riskIndicators: list[str]
    sources: list[str]


class OutcomeMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class OutcomeSimRequest(BaseModel):
    contractId: str
    messages: list[OutcomeMessage]


class OutcomeSimResponse(BaseModel):
    reply: str
    citations: list[str]
    confidence: float

