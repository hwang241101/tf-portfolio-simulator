import { Router } from "express";
import { listAssets } from "../controllers/asset.controller";

const router = Router();

router.get("/", listAssets);

export default router;

