import { Router } from "express";
import { exportReport, getReport, getReportByContract } from "../controllers/report.controller";

const router = Router();

router.get("/contract/:contractId", getReportByContract);
router.get("/:reportId", getReport);
router.post("/:reportId/export", exportReport);

export default router;
