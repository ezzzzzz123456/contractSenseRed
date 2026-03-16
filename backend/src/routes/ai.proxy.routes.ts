import { Router } from "express";
import {
  analyzeContract,
  generateIntelligenceReport,
  generateCounterClause,
  getStoredIntelligenceReport,
  getPartyIntelligence,
  getRiskFlags,
  queryContractAssistant,
  simplifyClause,
  simulateOutcome,
} from "../controllers/ai.proxy.controller";

const router = Router();

router.post("/analyze", analyzeContract);
router.post("/intelligence/report", generateIntelligenceReport);
router.get("/intelligence/contracts/:contractId", getStoredIntelligenceReport);
router.post("/intelligence/assistant/query", queryContractAssistant);
router.post("/simplify", simplifyClause);
router.post("/flags", getRiskFlags);
router.post("/counter-clause", generateCounterClause);
router.post("/party-intel", getPartyIntelligence);
router.post("/outcome-sim", simulateOutcome);

export default router;

