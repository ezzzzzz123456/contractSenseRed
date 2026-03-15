import { Router } from "express";
import {
  analyzeContract,
  generateCounterClause,
  getPartyIntelligence,
  getRiskFlags,
  simplifyClause,
  simulateOutcome,
} from "../controllers/ai.proxy.controller";

const router = Router();

router.post("/analyze", analyzeContract);
router.post("/simplify", simplifyClause);
router.post("/flags", getRiskFlags);
router.post("/counter-clause", generateCounterClause);
router.post("/party-intel", getPartyIntelligence);
router.post("/outcome-sim", simulateOutcome);

export default router;

