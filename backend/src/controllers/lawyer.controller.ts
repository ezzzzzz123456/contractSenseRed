import type { Request, Response } from "express";
import { LawyerModel } from "../models/Lawyer.model";

export const listLawyers = async (_req: Request, res: Response): Promise<void> => {
  const lawyers = await LawyerModel.find().lean();
  res.json(lawyers);
};

export const getLawyer = async (req: Request, res: Response): Promise<void> => {
  const lawyer = await LawyerModel.findById(req.params.lawyerId).lean();
  res.json(lawyer);
};

