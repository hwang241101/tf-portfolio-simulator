import { Router } from "express";
import {
  getPortfolioSummary,
  listPortfolios,
} from "../controllers/portfolio.controller";
import {
  applyRebalance,
  previewRebalance,
} from "../controllers/rebalance.controller";

const router = Router();

router.get("/", listPortfolios);
router.get("/:id/summary", getPortfolioSummary);
router.post("/:id/rebalance/preview", previewRebalance);
router.post("/:id/rebalance/apply", applyRebalance);

export default router;
