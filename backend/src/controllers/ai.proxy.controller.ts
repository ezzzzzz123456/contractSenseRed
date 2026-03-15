import type { Request, Response } from "express";
import { aiClient } from "../services/aiClient.service";

export const analyzeContract = async (req: Request, res: Response): Promise<void> => {
  const data = await aiClient.post("/ai/analyze", req.body);
  res.json(data);
};

export const simplifyClause = async (req: Request, res: Response): Promise<void> => {
  const data = await aiClient.post("/ai/simplify", req.body);
  res.json(data);
};

export const getRiskFlags = async (req: Request, res: Response): Promise<void> => {
  const data = await aiClient.post("/ai/flags", req.body);
  res.json(data);
};

export const generateCounterClause = async (req: Request, res: Response): Promise<void> => {
  const data = await aiClient.post("/ai/counter-clause", req.body);
  res.json(data);
};

export const getPartyIntelligence = async (req: Request, res: Response): Promise<void> => {
  const data = await aiClient.post("/ai/party-intel", req.body);
  res.json(data);
};

export const simulateOutcome = async (req: Request, res: Response): Promise<void> => {
  const data = await aiClient.post("/ai/outcome-sim", req.body);
  res.json(data);
};

