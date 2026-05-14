import { Router } from "express";
import {
  deleteAllocation,
  listAllocations,
  upsertAllocation,
} from "../controllers/allocation.controller";

const router = Router();

router.post("/", upsertAllocation);
router.get("/", listAllocations);
router.delete("/:id", deleteAllocation);

export default router;

