export type UserType = "user" | "lawyer";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type RiskFlagType = "red" | "yellow" | "green";
export type RiskCategory = "safe" | "warning" | "critical";
export type NegotiationTone = "gentle" | "professional" | "assertive" | "aggressive" | "legal formal";

export interface User {
  _id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  userType: UserType;
  verificationStatus: VerificationStatus;
  ratings: number;
  pricing: number;
}

export interface ContractTypePrediction {
  category: string;
  confidence: number;
  evidence: string[];
  alternatives: Record<string, number>;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  pageWidth: number;
  pageHeight: number;
}

export interface TableCell {
  rowIndex: number;
  columnIndex: number;
  text: string;
  bbox?: BoundingBox | null;
}

export interface DocumentElement {
  elementId: string;
  type: string;
  text: string;
  pageNumber: number;
  bbox?: BoundingBox | null;
  confidence: number;
  hierarchyPath: string[];
  parentId?: string | null;
  children: string[];
  tableCells: TableCell[];
  metadata: Record<string, string>;
}

export interface DocumentPage {
  pageNumber: number;
  width: number;
  height: number;
  elements: DocumentElement[];
}

export interface StructuredDocument {
  documentId: string;
  documentKind: string;
  extractionMethod: string;
  language: string;
  pages: DocumentPage[];
  hierarchy: string[];
  clauseSegments: Array<{
    clauseId: string;
    sectionReference: string;
    hierarchy: string[];
    title?: string;
    originalText: string;
  }>;
  tables: DocumentElement[];
  signatures: DocumentElement[];
  annotations: DocumentElement[];
  rawText: string;
  reconstructionNotes: string[];
}

export interface EvaluationMetricSet {
  documentStructureAccuracy: number;
  clauseDetectionAccuracy: number;
  tableExtractionAccuracy: number;
  layoutDetectionPrecision: number;
  processingLatencyMs: number;
  notes: string[];
}

export interface DocumentExtractionMetadata {
  documentKind: string;
  extractionMethod: string;
  sourceFilename: string;
  mediaType: string;
  structureConfidence: number;
  extractedCharacters: number;
  textPreview: string;
  notes: string[];
  structuredPages: number;
  layoutElements: number;
  tablesDetected: number;
  signaturesDetected: number;
  annotationsDetected: number;
}

export interface RiskMetricBreakdown {
  obligationAsymmetry: number;
  liabilityExposure: number;
  ambiguity: number;
  penaltySeverity: number;
  terminationVolatility: number;
  complianceExposure: number;
  loopholeExposure: number;
  fairnessImbalance: number;
  score: number;
  confidence: number;
  formula: string;
}

export interface ClauseImprovement {
  originalClause: string;
  revisedClause: string;
  justification: string;
}

export interface NegotiationStrategy {
  tone: NegotiationTone;
  stance: string;
  talkingPoints: string[];
  draftedResponse: string;
}

export interface LegalScenario {
  scenario: string;
  likelyConsequence: string;
  severity: RiskCategory;
  reasoning: string;
}

export interface CourtroomAssessment {
  judgeView: string;
  claimantArguments: string[];
  defenseArguments: string[];
  likelyRuling: string;
  enforceabilityConcerns: string[];
  businessImpact: string;
}

export interface Clause {
  clauseId: string;
  sectionReference: string;
  title?: string;
  text: string;
  simplifiedText: string;
  riskFlag: RiskFlagType;
  explanation: string;
  counterClauseSuggestion: string;
  riskScore: number;
  riskCategory: RiskCategory;
  recommendations: string[];
  loopholes: string[];
  legalScenarios: LegalScenario[];
  courtroomAssessment: CourtroomAssessment;
  negotiationDraft?: string;
  improvementJustification?: string;
}

export interface ContractRiskMetrics {
  meanClauseRisk: number;
  p90ClauseRisk: number;
  criticalClauseRatio: number;
  warningClauseRatio: number;
  riskDispersion: number;
  fairnessIndex: number;
  legalExposureIndex: number;
  concentrationIndex: number;
  aggregationFormula: string;
}

export interface ContractorCredibilityReport {
  score: number;
  rating: string;
  summary: string;
  positiveSignals: string[];
  negativeSignals: string[];
  sources: string[];
  framework: string;
}

export interface ContractAnalysisReport {
  contractId: string;
  contractType: ContractTypePrediction;
  extraction: DocumentExtractionMetadata;
  summary: string;
  executiveLegalSummary: string;
  overallRiskScore: number;
  overallRiskCategory: RiskCategory;
  keyVulnerabilities: string[];
  legalLoopholes: string[];
  illegalClauseAlerts: string[];
  recommendations: string[];
  priorityActions: string[];
  reportFindings: string[];
  metrics: ContractRiskMetrics;
  clauses: Array<{
    clauseId: string;
    sectionReference: string;
    title?: string;
    originalText: string;
    plainLanguage: string;
    riskScore: number;
    riskCategory: RiskCategory;
    colorIndicator: RiskFlagType;
    explanation: string;
    recommendations: string[];
    loopholes: string[];
    legalScenarios: LegalScenario[];
    courtroomAssessment: CourtroomAssessment;
    improvement: ClauseImprovement;
    negotiation: NegotiationStrategy;
  }>;
  documentStructure?: StructuredDocument | null;
  ingestionEvaluation?: EvaluationMetricSet | null;
  contractorCredibility?: ContractorCredibilityReport | null;
  evaluationMetrics: Record<string, string>;
  generatedAt: string;
}

export interface Contract {
  _id?: string;
  uploadedBy: string;
  fileUrl: string;
  contractType: string;
  status: string;
  clauseList: Clause[];
}

export interface Report {
  _id?: string;
  contractId: string;
  aiOutput: ContractAnalysisReport;
  lawyerOutput: Record<string, unknown>;
  trustSeal?: string;
  exportedPdfUrl?: string;
}

export interface Lawyer {
  _id?: string;
  userId: string;
  specializations: string[];
  isVerified: boolean;
  ratings: number;
  feePerReview: number;
}

export interface TrustSeal {
  _id?: string;
  reportId: string;
  lawyerId: string;
  issuedAt: string;
  sealHash: string;
}

export interface ContractAnalysisResponse {
  contractType: string;
  summary: string;
  clauses: Clause[];
  overallRiskScore: number;
  recommendations: string[];
  report?: ContractAnalysisReport;
}

export interface PartyIntelligence {
  partyName: string;
  summary: string;
  riskIndicators: string[];
  sources: string[];
  credibilityScore?: number;
}

export interface OutcomeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OutcomeSimulationResponse {
  reply: string;
  citations: string[];
  confidence: number;
}

export interface ContractIngestionPayload {
  contractId?: string;
  fileName: string;
  mediaType: string;
  documentBase64: string;
  contractText?: string;
  parties: string[];
  requestedTone: NegotiationTone;
  contractTypeHint?: string;
}
