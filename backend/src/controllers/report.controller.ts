import type { Request, Response } from "express";
import { ReportModel } from "../models/Report.model";

export const getReport = async (req: Request, res: Response): Promise<void> => {
  const report = await ReportModel.findById(req.params.reportId).lean();
  res.json(report);
};

export const exportReport = async (req: Request, res: Response): Promise<void> => {
  res.json({
    reportId: req.params.reportId,
    exportedPdfUrl: `https://cdn.contractsense.dev/reports/${req.params.reportId}.pdf`,
    status: "ready",
  });
};

