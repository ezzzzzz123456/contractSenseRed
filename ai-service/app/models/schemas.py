from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


RiskFlag = Literal["red", "yellow", "green"]
RiskCategory = Literal["safe", "warning", "critical"]
NegotiationTone = Literal["gentle", "professional", "assertive", "aggressive", "legal formal"]
DocumentKind = Literal["pdf", "docx", "txt", "image", "unknown"]
DocumentElementType = Literal["title", "section", "subsection", "clause", "table", "list", "signature", "footnote", "paragraph", "annotation"]


class ClauseModel(BaseModel):
    text: str
    simplifiedText: str
    riskFlag: RiskFlag
    explanation: str
    counterClauseSuggestion: str


class AnalyzeRequest(BaseModel):
    contractId: str
    contractText: str
    contractType: str = ""
    parties: list[str] = Field(default_factory=list)


class FlagItem(BaseModel):
    text: str
    riskFlag: RiskFlag
    explanation: str


class SimplifyRequest(BaseModel):
    clauseText: str
    context: str = ""


class SimplifyResponse(BaseModel):
    simplifiedText: str


class FlagsRequest(BaseModel):
    clauses: list[str]


class FlagsResponse(BaseModel):
    flags: list[FlagItem]


class CounterClauseRequest(BaseModel):
    clauseText: str
    goal: str
    tone: NegotiationTone = "professional"


class CounterClauseResponse(BaseModel):
    counterClauseSuggestion: str
    negotiationNotes: list[str]


class PartyIntelRequest(BaseModel):
    partyName: str
    website: HttpUrl | None = None
    publicSignals: list[str] = Field(default_factory=list)


class PartyIntelResponse(BaseModel):
    partyName: str
    summary: str
    riskIndicators: list[str]
    sources: list[str]
    credibilityScore: float | None = None


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


class CounterpartySignal(BaseModel):
    label: str
    source: str = "user"
    severity: float = Field(default=0.5, ge=0.0, le=1.0)
    sentiment: Literal["positive", "neutral", "negative"] = "neutral"
    evidence: str = ""


class BoundingBox(BaseModel):
    x0: float = Field(ge=0.0)
    y0: float = Field(ge=0.0)
    x1: float = Field(ge=0.0)
    y1: float = Field(ge=0.0)
    pageWidth: float = Field(ge=0.0)
    pageHeight: float = Field(ge=0.0)


class TableCell(BaseModel):
    rowIndex: int = Field(ge=0)
    columnIndex: int = Field(ge=0)
    text: str
    bbox: BoundingBox | None = None


class DocumentElement(BaseModel):
    elementId: str
    type: DocumentElementType
    text: str = ""
    pageNumber: int = Field(ge=1)
    bbox: BoundingBox | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    hierarchyPath: list[str] = Field(default_factory=list)
    parentId: str | None = None
    children: list[str] = Field(default_factory=list)
    tableCells: list[TableCell] = Field(default_factory=list)
    metadata: dict[str, str] = Field(default_factory=dict)


class DocumentPage(BaseModel):
    pageNumber: int = Field(ge=1)
    width: float = Field(ge=0.0)
    height: float = Field(ge=0.0)
    elements: list[DocumentElement] = Field(default_factory=list)


class StructuredDocument(BaseModel):
    documentId: str
    documentKind: DocumentKind
    extractionMethod: str
    language: str = "en"
    pages: list[DocumentPage] = Field(default_factory=list)
    hierarchy: list[str] = Field(default_factory=list)
    clauseSegments: list["ClauseSegment"] = Field(default_factory=list)
    tables: list[DocumentElement] = Field(default_factory=list)
    signatures: list[DocumentElement] = Field(default_factory=list)
    annotations: list[DocumentElement] = Field(default_factory=list)
    rawText: str = ""
    reconstructionNotes: list[str] = Field(default_factory=list)


class EvaluationMetricSet(BaseModel):
    documentStructureAccuracy: float = Field(default=0.0, ge=0.0, le=1.0)
    clauseDetectionAccuracy: float = Field(default=0.0, ge=0.0, le=1.0)
    tableExtractionAccuracy: float = Field(default=0.0, ge=0.0, le=1.0)
    layoutDetectionPrecision: float = Field(default=0.0, ge=0.0, le=1.0)
    processingLatencyMs: float = Field(default=0.0, ge=0.0)
    notes: list[str] = Field(default_factory=list)


class DocumentExtractionMetadata(BaseModel):
    documentKind: DocumentKind
    extractionMethod: str
    sourceFilename: str
    mediaType: str
    structureConfidence: float = Field(ge=0.0, le=1.0)
    extractedCharacters: int = 0
    textPreview: str = ""
    notes: list[str] = Field(default_factory=list)
    structuredPages: int = 0
    layoutElements: int = 0
    tablesDetected: int = 0
    signaturesDetected: int = 0
    annotationsDetected: int = 0


class ClauseSegment(BaseModel):
    clauseId: str
    sectionReference: str
    hierarchy: list[str] = Field(default_factory=list)
    title: str = ""
    originalText: str


class ContractTypePrediction(BaseModel):
    category: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: list[str] = Field(default_factory=list)
    alternatives: dict[str, float] = Field(default_factory=dict)


class RiskMetricBreakdown(BaseModel):
    obligationAsymmetry: float = Field(ge=0.0, le=1.0)
    liabilityExposure: float = Field(ge=0.0, le=1.0)
    ambiguity: float = Field(ge=0.0, le=1.0)
    penaltySeverity: float = Field(ge=0.0, le=1.0)
    terminationVolatility: float = Field(ge=0.0, le=1.0)
    complianceExposure: float = Field(ge=0.0, le=1.0)
    loopholeExposure: float = Field(ge=0.0, le=1.0)
    fairnessImbalance: float = Field(ge=0.0, le=1.0)
    score: float = Field(ge=0.0, le=100.0)
    confidence: float = Field(ge=0.0, le=1.0)
    formula: str


class ClauseImprovement(BaseModel):
    originalClause: str
    revisedClause: str
    justification: str


class NegotiationStrategy(BaseModel):
    tone: NegotiationTone
    stance: str
    talkingPoints: list[str]
    draftedResponse: str


class LegalScenario(BaseModel):
    scenario: str
    likelyConsequence: str
    severity: RiskCategory
    reasoning: str


class CourtroomAssessment(BaseModel):
    judgeView: str
    claimantArguments: list[str] = Field(default_factory=list)
    defenseArguments: list[str] = Field(default_factory=list)
    likelyRuling: str
    enforceabilityConcerns: list[str] = Field(default_factory=list)
    businessImpact: str


class ClauseAnalysis(BaseModel):
    clauseId: str
    sectionReference: str
    hierarchy: list[str] = Field(default_factory=list)
    title: str = ""
    originalText: str
    plainLanguage: str
    clauseType: str
    riskCategory: RiskCategory
    colorIndicator: RiskFlag
    riskScore: float = Field(ge=0.0, le=100.0)
    confidence: float = Field(ge=0.0, le=1.0)
    explanation: str
    riskBreakdown: RiskMetricBreakdown
    loopholes: list[str] = Field(default_factory=list)
    illegalSignals: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    improvement: ClauseImprovement
    negotiation: NegotiationStrategy
    legalScenarios: list[LegalScenario] = Field(default_factory=list)
    courtroomAssessment: CourtroomAssessment


class ContractRiskMetrics(BaseModel):
    meanClauseRisk: float = Field(ge=0.0, le=100.0)
    p90ClauseRisk: float = Field(ge=0.0, le=100.0)
    criticalClauseRatio: float = Field(ge=0.0, le=1.0)
    warningClauseRatio: float = Field(ge=0.0, le=1.0)
    riskDispersion: float = Field(ge=0.0, le=1.0)
    fairnessIndex: float = Field(ge=0.0, le=100.0)
    legalExposureIndex: float = Field(ge=0.0, le=100.0)
    concentrationIndex: float = Field(ge=0.0, le=100.0)
    aggregationFormula: str


class ContractorCredibilityReport(BaseModel):
    score: float = Field(ge=0.0, le=100.0)
    rating: str
    summary: str
    positiveSignals: list[str] = Field(default_factory=list)
    negativeSignals: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
    framework: str


class ContractAnalysisReport(BaseModel):
    contractId: str
    contractType: ContractTypePrediction
    extraction: DocumentExtractionMetadata
    summary: str
    executiveLegalSummary: str = ""
    overallRiskScore: float = Field(ge=0.0, le=100.0)
    overallRiskCategory: RiskCategory
    keyVulnerabilities: list[str] = Field(default_factory=list)
    legalLoopholes: list[str] = Field(default_factory=list)
    illegalClauseAlerts: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    priorityActions: list[str] = Field(default_factory=list)
    reportFindings: list[str] = Field(default_factory=list)
    metrics: ContractRiskMetrics
    clauses: list[ClauseAnalysis]
    documentStructure: StructuredDocument | None = None
    ingestionEvaluation: EvaluationMetricSet | None = None
    contractorCredibility: ContractorCredibilityReport | None = None
    evaluationMetrics: dict[str, str] = Field(default_factory=dict)
    generatedAt: datetime


class AnalyzeResponse(BaseModel):
    contractType: str
    summary: str
    clauses: list[ClauseModel]
    overallRiskScore: int
    recommendations: list[str]
    report: ContractAnalysisReport | None = None


class DocumentUnderstandingResponse(BaseModel):
    extraction: DocumentExtractionMetadata
    structuredDocument: StructuredDocument | None = None
    evaluation: EvaluationMetricSet | None = None


class ContractIngestionRequest(BaseModel):
    contractId: str | None = None
    fileName: str = "uploaded-contract.txt"
    mediaType: str = "text/plain"
    documentBase64: str = ""
    contractText: str = ""
    parties: list[str] = Field(default_factory=list)
    requestedTone: NegotiationTone = "professional"
    contractTypeHint: str = ""
    publicSignals: list[CounterpartySignal] = Field(default_factory=list)


class StoredContractRecord(BaseModel):
    contractId: str
    report: ContractAnalysisReport
    searchableText: str
    createdAt: datetime
    updatedAt: datetime


class ContractAssistantQueryRequest(BaseModel):
    question: str
    contractId: str | None = None
    topK: int = Field(default=3, ge=1, le=10)


class EvidenceSnippet(BaseModel):
    contractId: str
    clauseId: str
    score: float = Field(ge=0.0, le=1.0)
    snippet: str


class ContractAssistantQueryResponse(BaseModel):
    answer: str
    evidence: list[EvidenceSnippet]
    referencedContracts: list[str]
    confidence: float = Field(ge=0.0, le=1.0)


class HealthEnvelope(BaseModel):
    status: str
    details: dict[str, Any] = Field(default_factory=dict)


StructuredDocument.model_rebuild()
