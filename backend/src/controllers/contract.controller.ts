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

  const contractText = await fileParser.extractText(contract.fileUrl);
  const analysis = await aiClient.post<AnalyzeResponse>("/ai/analyze", {
    contractId: contract._id.toString(),
    contractText,
    contractType: contract.contractType,
    parties: req.body.parties ?? [],
  });

  contract.contractType = analysis.contractType || contract.contractType;
  contract.status = "analyzed";
  contract.clauseList = analysis.clauses;
  await contract.save();

  const report = await ReportModel.findOneAndUpdate(
    { contractId: contract._id },
    {
      contractId: contract._id,
      aiOutput: {
        summary: analysis.summary,
        overallRiskScore: analysis.overallRiskScore,
        recommendations: analysis.recommendations,
      },
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
