import { Router } from "express";
import {
  createShareLink,
  exportReport,
  getReport,
  getReportByContract,
  getSharedReport,
  issueTrustSeal,
  updateLawyerReview,
} from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/shared/:shareToken", getSharedReport);
router.get("/contract/:contractId", requireAuth, getReportByContract);
router.get("/:reportId", requireAuth, getReport);
router.patch("/:reportId/lawyer-review", requireAuth, updateLawyerReview);
router.post("/:reportId/trust-seal", requireAuth, issueTrustSeal);
router.post("/:reportId/export", requireAuth, exportReport);
router.post("/:reportId/share", requireAuth, createShareLink);

export default router;
