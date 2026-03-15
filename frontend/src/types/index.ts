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

export interface Report {
  _id?: string;
  contractId: string;
  aiOutput: Record<string, unknown>;
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
