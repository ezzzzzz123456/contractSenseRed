import type { Request, Response } from "express";
import axios from "axios";
import { aiClient } from "../services/aiClient.service";

const handleAiProxyError = (error: unknown, res: Response): void => {
  if (axios.isAxiosError(error)) {
    res.status(error.response?.status ?? 502).json({
      message: "AI service request failed.",
      detail: typeof error.response?.data === "string" ? error.response.data : error.response?.data,
    });
    return;
  }
  res.status(500).json({ message: "Unexpected AI proxy failure." });
};

export const analyzeContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.post("/ai/analyze", req.body);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

export const generateIntelligenceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.post("/ai/intelligence/report", req.body);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

export const getStoredIntelligenceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.get(`/ai/intelligence/contracts/${req.params.contractId}`);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

export const queryContractAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.post("/ai/intelligence/assistant/query", req.body);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

export const simplifyClause = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.post("/ai/simplify", req.body);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

export const getRiskFlags = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.post("/ai/flags", req.body);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

export const generateCounterClause = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.post("/ai/counter-clause", req.body);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

export const getPartyIntelligence = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.post("/ai/party-intel", req.body);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

export const simulateOutcome = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await aiClient.post("/ai/outcome-sim", req.body);
    res.json(data);
  } catch (error) {
    handleAiProxyError(error, res);
  }
};

