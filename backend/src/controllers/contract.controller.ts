import type { Response } from "express";
import { ContractModel } from "../models/Contract.model";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { buildFileUrl } from "../utils/pdfUpload";

export const uploadContract = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const fileUrl = buildFileUrl(req.file?.filename ?? "demo.pdf");
  const contract = await ContractModel.create({
    uploadedBy: req.user?.userId,
    fileUrl,
    contractType: req.body.contractType ?? "general",
    status: "uploaded",
    clauseList: [],
  });

  res.status(201).json(contract);
};

export const listContracts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const contracts = await ContractModel.find({ uploadedBy: req.user?.userId }).lean();
  res.json(contracts);
};

