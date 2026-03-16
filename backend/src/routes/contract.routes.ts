import { Router } from "express";
import { analyzeUploadedContract, getContractById, listContracts, uploadContract } from "../controllers/contract.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.get("/", requireAuth, listContracts);
router.get("/:contractId", requireAuth, getContractById);
router.post("/", requireAuth, upload.single("file"), uploadContract);
router.post("/:contractId/analyze", requireAuth, analyzeUploadedContract);

export default router;
