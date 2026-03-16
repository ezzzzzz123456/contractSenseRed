import { Router } from "express";
import { getAssignedReviews, getLawyer, listLawyers, requestLawyerReview } from "../controllers/lawyer.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", listLawyers);
router.get("/assigned/reviews", requireAuth, getAssignedReviews);
router.post("/request-review", requireAuth, requestLawyerReview);
router.get("/:lawyerId", getLawyer);

export default router;
