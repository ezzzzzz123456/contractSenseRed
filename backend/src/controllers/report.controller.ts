import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ContractModel } from "../models/Contract.model";
import { LawyerModel } from "../models/Lawyer.model";
import { ReportModel } from "../models/Report.model";
import { TrustSealModel } from "../models/TrustSeal.model";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { env } from "../config/env";
import { createReportPdf } from "../utils/reportExport";

const toRelativeUploadUrl = (relativeUrl?: string | null): string | undefined => {
  if (!relativeUrl) {
    return undefined;
  }

  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }

  return `${env.clientUrl.replace(/\/$/, "")}${relativeUrl}`;
};

const serializeTrustSeal = (trustSeal: {
  _id: { toString(): string };
  reportId: { toString(): string } | string;
  lawyerId: { toString(): string } | string;
  issuedAt: Date;
  sealHash: string;
}) => ({
  _id: trustSeal._id.toString(),
  reportId: typeof trustSeal.reportId === "string" ? trustSeal.reportId : trustSeal.reportId.toString(),
  lawyerId: typeof trustSeal.lawyerId === "string" ? trustSeal.lawyerId : trustSeal.lawyerId.toString(),
  issuedAt: trustSeal.issuedAt.toISOString(),
  sealHash: trustSeal.sealHash,
});

const isPopulatedTrustSeal = (
  value: unknown,
): value is {
  _id: { toString(): string };
  reportId: { toString(): string } | string;
  lawyerId: { toString(): string } | string;
  issuedAt: Date;
  sealHash: string;
} => Boolean(
  value &&
    typeof value === "object" &&
    "_id" in value &&
    "reportId" in value &&
    "lawyerId" in value &&
    "issuedAt" in value &&
    "sealHash" in value,
);

const serializeReport = (
  report: {
    _id: { toString(): string };
    contractId: { toString(): string } | string;
    aiOutput: Record<string, unknown>;
    lawyerOutput: Record<string, unknown>;
    trustSeal?: unknown;
    exportedPdfUrl?: string | null;
    shareToken?: string | null;
    shareExpiresAt?: Date | null;
  },
) => ({
  _id: report._id.toString(),
  contractId: typeof report.contractId === "string" ? report.contractId : report.contractId.toString(),
  aiOutput: report.aiOutput,
  lawyerOutput: report.lawyerOutput ?? {},
  trustSeal: isPopulatedTrustSeal(report.trustSeal) ? serializeTrustSeal(report.trustSeal) : undefined,
  exportedPdfUrl: toRelativeUploadUrl(report.exportedPdfUrl),
  shareUrl: report.shareToken ? `${env.clientUrl.replace(/\/$/, "")}/report/shared/${report.shareToken}` : undefined,
  shareExpiresAt: report.shareExpiresAt?.toISOString(),
});

const resolveLawyerProfile = async (userId: string) => {
  const existing = await LawyerModel.findOne({ userId });

  if (existing) {
    return existing;
  }

  return LawyerModel.create({
    userId,
    specializations: ["Contract Review", "Trust Seal Verification"],
    isVerified: true,
    ratings: 5,
    feePerReview: 0,
  });
};

export const getReport = async (req: Request, res: Response): Promise<void> => {
  const report = await ReportModel.findById(req.params.reportId).populate("trustSeal").lean();

  if (!report) {
    res.status(404).json({ message: "Report not found" });
    return;
  }

  res.json(serializeReport(report));
};

export const getReportByContract = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

  const report = await ReportModel.findOne({ contractId: req.params.contractId }).populate("trustSeal").lean();

  if (!report) {
    res.status(404).json({ message: "Report not found for contract" });
    return;
  }

  res.json(serializeReport(report));
};

export const getSharedReport = async (req: Request, res: Response): Promise<void> => {
  const report = await ReportModel.findOne({
    shareToken: req.params.shareToken,
    shareExpiresAt: { $gt: new Date() },
  }).populate("trustSeal").lean();

  if (!report) {
    res.status(404).json({ message: "Shared report not found or has expired" });
    return;
  }

  res.json(serializeReport(report));
};

export const updateLawyerReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (req.user.userType !== "lawyer") {
    res.status(403).json({ message: "Lawyer account required" });
    return;
  }

  const report = await ReportModel.findById(req.params.reportId);

  if (!report) {
    res.status(404).json({ message: "Report not found" });
    return;
  }

  const lawyerProfile = await resolveLawyerProfile(req.user.userId);
  const payload = req.body as {
    summary?: string;
    recommendation?: string;
    finalVerdict?: string;
    annotations?: Array<{ clauseReference?: string; note?: string; authorRole?: string }>;
  };

  report.lawyerOutput = {
    ...(report.lawyerOutput ?? {}),
    reviewedBy: lawyerProfile.userId.toString(),
    reviewedAt: new Date().toISOString(),
    summary: payload.summary ?? (report.lawyerOutput as Record<string, unknown>)?.summary,
    recommendation: payload.recommendation ?? (report.lawyerOutput as Record<string, unknown>)?.recommendation,
    finalVerdict: payload.finalVerdict ?? (report.lawyerOutput as Record<string, unknown>)?.finalVerdict ?? "Proceed with signature",
    annotations: (payload.annotations ?? []).map((annotation, index) => ({
      id: crypto.randomUUID(),
      clauseReference: annotation.clauseReference ?? `Clause ${index + 1}`,
      note: annotation.note ?? "",
      authorName: "Assigned Counsel",
      authorRole: annotation.authorRole ?? "Legal Reviewer",
      createdAt: new Date().toISOString(),
    })),
  };

  await report.save();
  const populated = await ReportModel.findById(report._id).populate("trustSeal").lean();
  res.json({
    message: "Lawyer review saved",
    report: populated ? serializeReport(populated) : null,
  });
};

export const issueTrustSeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (req.user.userType !== "lawyer") {
    res.status(403).json({ message: "Lawyer account required" });
    return;
  }

  const report = await ReportModel.findById(req.params.reportId);

  if (!report) {
    res.status(404).json({ message: "Report not found" });
    return;
  }

  const lawyerProfile = await resolveLawyerProfile(req.user.userId);
  const sealHash = crypto
    .createHash("sha256")
    .update(`${report._id.toString()}:${lawyerProfile._id.toString()}:${new Date().toISOString()}`)
    .digest("hex");

  const trustSeal = await TrustSealModel.findOneAndUpdate(
    { reportId: report._id },
    {
      reportId: report._id,
      lawyerId: lawyerProfile._id,
      issuedAt: new Date(),
      sealHash,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  report.trustSeal = trustSeal._id;
  report.lawyerOutput = {
    ...(report.lawyerOutput ?? {}),
    finalVerdict: (req.body as { finalVerdict?: string }).finalVerdict ?? "Proceed with signature",
    sealIssuedBy: lawyerProfile.userId.toString(),
    sealIssuedAt: trustSeal.issuedAt.toISOString(),
  };
  await report.save();

  await ContractModel.findByIdAndUpdate(report.contractId, { status: "reviewed" });

  const populated = await ReportModel.findById(report._id).populate("trustSeal").lean();
  res.json({
    message: "Trust seal issued",
    report: populated ? serializeReport(populated) : null,
  });
};

export const exportReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const report = await ReportModel.findById(req.params.reportId);

  if (!report) {
    res.status(404).json({ message: "Report not found" });
    return;
  }

  const contract = await ContractModel.findById(report.contractId).lean();

  if (!contract) {
    res.status(404).json({ message: "Contract not found" });
    return;
  }

  const exportedPdfUrl = await createReportPdf({
    reportId: report._id.toString(),
    contractName: contract.fileUrl.split("/").pop() ?? contract.contractType,
    summary: String((report.aiOutput as Record<string, unknown>)?.summary ?? ""),
    recommendations: Array.isArray((report.aiOutput as Record<string, unknown>)?.recommendations)
      ? ((report.aiOutput as Record<string, unknown>).recommendations as string[])
      : [],
    riskScore: Number((report.aiOutput as Record<string, unknown>)?.overallRiskScore ?? 0),
    trustSealStatus: report.trustSeal ? "Verified" : "Pending Review",
  });

  report.exportedPdfUrl = exportedPdfUrl;
  await report.save();

  res.json({
    reportId: req.params.reportId,
    exportedPdfUrl: toRelativeUploadUrl(exportedPdfUrl),
    status: "ready",
  });
};

export const createShareLink = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const report = await ReportModel.findById(req.params.reportId);

  if (!report) {
    res.status(404).json({ message: "Report not found" });
    return;
  }

  const shareToken = crypto.randomBytes(18).toString("hex");
  const shareExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  report.shareToken = shareToken;
  report.shareExpiresAt = shareExpiresAt;
  report.sharedAt = new Date();
  await report.save();

  res.json({
    reportId: req.params.reportId,
    shareUrl: `${env.clientUrl.replace(/\/$/, "")}/report/shared/${shareToken}`,
    shareToken,
    shareExpiresAt: shareExpiresAt.toISOString(),
  });
};
