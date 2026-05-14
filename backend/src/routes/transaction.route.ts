import { Router } from "express";
import { createTransaction } from "../controllers/transaction.controller";
import { deleteTransaction } from "../controllers/transaction.controller";
import { listTransactions } from "../controllers/transaction.controller";

const router = Router();

router.post("/", createTransaction);
router.get("/", listTransactions);
router.delete("/:id", deleteTransaction);

export default router;
