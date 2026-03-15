import { Router } from "express";
import { getLawyer, listLawyers } from "../controllers/lawyer.controller";

const router = Router();

router.get("/", listLawyers);
router.get("/:lawyerId", getLawyer);

export default router;

