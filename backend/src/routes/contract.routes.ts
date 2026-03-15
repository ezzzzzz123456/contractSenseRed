import { Router } from "express";
import { listContracts, uploadContract } from "../controllers/contract.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.get("/", requireAuth, listContracts);
router.post("/", requireAuth, upload.single("file"), uploadContract);

export default router;

