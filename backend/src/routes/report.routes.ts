import { Router } from "express";
import { exportReport, getReport } from "../controllers/report.controller";

const router = Router();

router.get("/:reportId", getReport);
router.post("/:reportId/export", exportReport);

export default router;

