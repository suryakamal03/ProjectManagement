import express from "express";
import { authMiddleware } from "../middleware/user.middleware";
import { generateDescription,SuggestPriority,generateSummary,generateWeeklyReport} from "../controllers/AI.controllers";

const router = express.Router();
router.post("/generate-description", authMiddleware, generateDescription);
router.post("/suggest-priority", authMiddleware, SuggestPriority);
router.post("/generate-summary", authMiddleware, generateSummary);
router.post("/generate-weekly-report", authMiddleware, generateWeeklyReport);
export default router;