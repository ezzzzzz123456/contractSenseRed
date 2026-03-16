import type { Request, Response } from "express";
import { ReportModel } from "../models/Report.model";

export const getReport = async (req: Request, res: Response): Promise<void> => {
  const report = await ReportModel.findById(req.params.reportId).lean();
  res.json(report);
};

export const getReportByContract = async (req: Request, res: Response): Promise<void> => {
  const report = await ReportModel.findOne({ contractId: req.params.contractId }).lean();

  if (!report) {
    res.status(404).json({ message: "Report not found for contract" });
    return;
  }

  res.json({
    _id: report._id.toString(),
    contractId: report.contractId.toString(),
    aiOutput: report.aiOutput,
    lawyerOutput: report.lawyerOutput,
    trustSeal: report.trustSeal ? report.trustSeal.toString() : undefined,
    exportedPdfUrl: report.exportedPdfUrl,
  });
};

export const exportReport = async (req: Request, res: Response): Promise<void> => {
  res.json({
    reportId: req.params.reportId,
    exportedPdfUrl: `https://cdn.contractsense.dev/reports/${req.params.reportId}.pdf`,
    status: "ready",
  });
};
