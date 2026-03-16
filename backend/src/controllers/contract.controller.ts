import fs from "node:fs/promises";
import path from "node:path";
import type { Response } from "express";
import { ContractModel } from "../models/Contract.model";
import { ReportModel } from "../models/Report.model";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { buildFileUrl } from "../utils/pdfUpload";
import { fileParser } from "../utils/fileParser";
import { aiClient } from "../services/aiClient.service";

interface AnalysisClause {
  text: string;
  simplifiedText: string;
  riskFlag: "red" | "yellow" | "green";
  explanation: string;
  counterClauseSuggestion: string;
}

interface AnalyzeResponse {
  contractType: string;
  summary: string;
  clauses: AnalysisClause[];
  overallRiskScore: number;
  recommendations: string[];
}

interface DetailedAnalysisClause {
  originalText: string;
  plainLanguage: string;
  colorIndicator: "red" | "yellow" | "green";
  explanation: string;
  improvement?: {
    revisedClause?: string;
  };
}

interface DetailedAnalysisReport {
  contractId: string;
  summary: string;
  overallRiskScore: number;
  recommendations: string[];
  contractType?: {
    category?: string;
  };
  clauses: DetailedAnalysisClause[];
}

const getAbsoluteUploadPath = (fileUrl: string): string =>
  path.resolve(process.cwd(), fileUrl.replace(/^\//, ""));

const inferMediaType = (fileUrl: string): string => {
  const ext = path.extname(fileUrl).toLowerCase();

  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".txt":
      return "text/plain";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
};

const mapDetailedClauses = (clauses: DetailedAnalysisClause[]): AnalysisClause[] =>
  clauses.map((clause) => ({
    text: clause.originalText,
    simplifiedText: clause.plainLanguage,
    riskFlag: clause.colorIndicator,
    explanation: clause.explanation,
    counterClauseSuggestion:
      clause.improvement?.revisedClause?.trim() || "Counter-clause recommendation unavailable for this clause.",
  }));

const serializeContract = (contract: {
  _id: { toString(): string };
  uploadedBy: { toString(): string } | string;
  fileUrl: string;
  contractType: string;
  status: string;
  clauseList: unknown[];
}) => ({
  _id: contract._id.toString(),
  uploadedBy:
    typeof contract.uploadedBy === "string" ? contract.uploadedBy : contract.uploadedBy.toString(),
  fileUrl: contract.fileUrl,
  contractType: contract.contractType,
  status: contract.status,
  clauseList: contract.clauseList,
});

export const uploadContract = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: "A contract file is required" });
    return;
  }

  const fileUrl = buildFileUrl(req.file.filename);
  const contract = await ContractModel.create({
    uploadedBy: req.user.userId,
    fileUrl,
    contractType: req.body.contractType ?? "general",
    status: "uploaded",
    clauseList: [],
  });

  res.status(201).json({
    message: "Contract uploaded successfully",
    contract: serializeContract(contract),
  });
};

export const listContracts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const contracts = await ContractModel.find({ uploadedBy: req.user?.userId }).lean();
  res.json({
    contracts: contracts.map((contract) => ({
      _id: contract._id.toString(),
      uploadedBy: contract.uploadedBy.toString(),
      fileUrl: contract.fileUrl,
      contractType: contract.contractType,
      status: contract.status,
      clauseList: contract.clauseList,
    })),
  });
};

export const getContractById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const contract = await ContractModel.findOne({
    _id: req.params.contractId,
    uploadedBy: req.user.userId,
  }).lean();

  if (!contract) {
    res.status(404).json({ message: "Contract not found" });
    return;
  }

  res.json({
    contract: {
      _id: contract._id.toString(),
      uploadedBy: contract.uploadedBy.toString(),
      fileUrl: contract.fileUrl,
      contractType: contract.contractType,
      status: contract.status,
      clauseList: contract.clauseList,
    },
  });
};

export const analyzeUploadedContract = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const contract = await ContractModel.findOne({
    _id: req.params.contractId,
    uploadedBy: req.user.userId,
  });

  if (!contract) {
    res.status(404).json({ message: "Contract not found" });
    return;
  }

  let analysis: AnalyzeResponse;
  let reportPayload: Record<string, unknown>;

  try {
    const absolutePath = getAbsoluteUploadPath(contract.fileUrl);
    const rawFile = await fs.readFile(absolutePath);
    const detailedReport = await aiClient.post<DetailedAnalysisReport>("/ai/intelligence/report", {
      contractId: contract._id.toString(),
      fileName: path.basename(contract.fileUrl),
      mediaType: inferMediaType(contract.fileUrl),
      documentBase64: rawFile.toString("base64"),
      contractTypeHint: contract.contractType,
      parties: req.body.parties ?? [],
      requestedTone: "professional",
    });

    analysis = {
      contractType: detailedReport.contractType?.category ?? contract.contractType,
      summary: detailedReport.summary,
      clauses: mapDetailedClauses(detailedReport.clauses),
      overallRiskScore: detailedReport.overallRiskScore,
      recommendations: detailedReport.recommendations,
    };
    reportPayload = detailedReport as unknown as Record<string, unknown>;
  } catch {
    const contractText = await fileParser.extractText(contract.fileUrl);
    const legacyAnalysis = await aiClient.post<AnalyzeResponse>("/ai/analyze", {
      contractId: contract._id.toString(),
      contractText,
      contractType: contract.contractType,
      parties: req.body.parties ?? [],
    });

    analysis = legacyAnalysis;
    reportPayload = {
      summary: legacyAnalysis.summary,
      overallRiskScore: legacyAnalysis.overallRiskScore,
      recommendations: legacyAnalysis.recommendations,
    };
  }

  contract.contractType = analysis.contractType || contract.contractType;
  contract.status = "analyzed";
  contract.clauseList = analysis.clauses as typeof contract.clauseList;
  await contract.save();

  const report = await ReportModel.findOneAndUpdate(
    { contractId: contract._id },
    {
      contractId: contract._id,
      aiOutput: reportPayload,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.json({
    message: "Contract analysis completed",
    contract: serializeContract(contract),
    report: report
      ? {
          _id: report._id.toString(),
          contractId: report.contractId.toString(),
          aiOutput: report.aiOutput,
          lawyerOutput: report.lawyerOutput,
          trustSeal: report.trustSeal ? report.trustSeal.toString() : undefined,
          exportedPdfUrl: report.exportedPdfUrl,
        }
      : null,
  });
};
