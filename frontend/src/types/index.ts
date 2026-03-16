export type UserType = "user" | "lawyer";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type RiskFlagType = "red" | "yellow" | "green";

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

export interface Clause {
  text: string;
  simplifiedText: string;
  riskFlag: RiskFlagType;
  explanation: string;
  counterClauseSuggestion: string;
}

export interface Contract {
  _id?: string;
  uploadedBy: string;
  fileUrl: string;
  contractType: string;
  status: string;
  clauseList: Clause[];
}

export interface LawyerAnnotation {
  id: string;
  clauseReference: string;
  note: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface LawyerOutput {
  reviewedBy?: string;
  reviewedAt?: string;
  summary?: string;
  recommendation?: string;
  finalVerdict?: string;
  annotations?: LawyerAnnotation[];
  sealIssuedBy?: string;
  sealIssuedAt?: string;
}

export interface Report {
  _id?: string;
  contractId: string;
  aiOutput: {
    summary?: string;
    overallRiskScore?: number;
    recommendations?: string[];
    [key: string]: unknown;
  };
  lawyerOutput: LawyerOutput;
  trustSeal?: TrustSeal;
  exportedPdfUrl?: string;
  shareUrl?: string;
  shareExpiresAt?: string;
}

export interface Lawyer {
  _id?: string;
  userId: string;
  name?: string;
  email?: string;
  specializations: string[];
  isVerified: boolean;
  ratings: number;
  feePerReview: number;
  verificationStatus?: VerificationStatus;
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
}

export interface PartyIntelligence {
  partyName: string;
  summary: string;
  riskIndicators: string[];
  sources: string[];
}

export interface OutcomeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface CurrentUserResponse {
  user: User;
}

export interface ContractListResponse {
  contracts: Contract[];
}

export interface ContractResponse {
  contract: Contract;
}

export interface ContractUploadResponse {
  message: string;
  contract: Contract;
}

export interface ContractAnalysisTriggerResponse {
  message: string;
  contract: Contract;
  report: Report | null;
}

export interface LawyerReviewPayload {
  summary: string;
  recommendation: string;
  finalVerdict: string;
  annotations: Array<{
    clauseReference: string;
    note: string;
    authorRole: string;
  }>;
}

export interface LawyerReviewResponse {
  message: string;
  report: Report | null;
}

export interface ShareReportResponse {
  reportId: string;
  shareUrl: string;
  shareToken: string;
  shareExpiresAt: string;
}

export interface ExportReportResponse {
  reportId: string;
  exportedPdfUrl: string;
  status: string;
}

export interface LawyerReviewRequestResponse {
  message: string;
  contractId: string;
  reportId: string;
  lawyer: Lawyer;
}

export interface AssignedReview {
  reportId: string;
  contractId: string;
  contractName: string;
  contractType: string;
  contractStatus: string;
  requestedAt: string | null;
  requestNote: string;
  reviewStatus: string;
  overallRiskScore: number | null;
}

export interface AssignedReviewListResponse {
  reviews: AssignedReview[];
}
