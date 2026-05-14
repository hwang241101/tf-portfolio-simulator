import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { portfolioId, assetId, type, quantity, price } = req.body;

    if (!portfolioId || !assetId) {
      return res
        .status(400)
        .json({ error: "portfolioId and assetId are required" });
    }

    if (quantity <= 0 || price <= 0) {
      return res
        .status(400)
        .json({ error: "quantity and price must be positive" });
    }

    if (type !== "BUY" && type !== "SELL") {
      return res.status(400).json({ error: "type must be BUY or SELL" });
    }

    // SELL 시 현재 보유 수량보다 많이 팔지 못하게 검증
    if (type === "SELL") {
      const existingTransactions = await prisma.transaction.findMany({
        where: {
          portfolioId: BigInt(portfolioId),
          assetId: BigInt(assetId),
        },
      });

      const currentQuantity = existingTransactions.reduce((sum, tx) => {
        const signedQty =
          tx.type.toUpperCase() === "SELL"
            ? -Number(tx.quantity)
            : Number(tx.quantity);
        return sum + signedQty;
      }, 0);

      if (currentQuantity < quantity) {
        return res.status(400).json({
          error: "보유 수량보다 많이 팔 수 없습니다.",
        });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        portfolioId: BigInt(portfolioId),
        assetId: BigInt(assetId),
        type,
        quantity,
        price,
        transactionDate: new Date(),
      },
    });

    res.status(201).json({
      ...transaction,
      id: transaction.id.toString(),
      portfolioId: transaction.portfolioId.toString(),
      assetId: transaction.assetId.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Transaction creation failed" });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id) || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid transaction id" });
    }

    const existing = await prisma.transaction.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await prisma.transaction.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Transaction deletion failed" });
  }
};

export const listTransactions = async (req: Request, res: Response) => {
  try {
    const { portfolioId, page = "1", pageSize = "10" } = req.query;
    if (
      !portfolioId ||
      typeof portfolioId !== "string" ||
      !/^\d+$/.test(portfolioId)
    ) {
      return res.status(400).json({ error: "Invalid portfolioId query" });
    }

    if (
      typeof page !== "string" ||
      typeof pageSize !== "string" ||
      !/^\d+$/.test(page) ||
      !/^\d+$/.test(pageSize)
    ) {
      return res.status(400).json({ error: "Invalid page/pageSize query" });
    }

    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);
    if (pageNum < 1 || pageSizeNum < 1 || pageSizeNum > 100) {
      return res.status(400).json({ error: "page/pageSize out of range" });
    }

    const where = { portfolioId: BigInt(portfolioId) };
    const skip = (pageNum - 1) * pageSizeNum;

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { asset: true },
        orderBy: { transactionDate: "desc" },
        skip,
        take: pageSizeNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json(
      {
        items: transactions.map((transaction) => ({
          id: transaction.id.toString(),
          portfolioId: transaction.portfolioId.toString(),
          assetId: transaction.assetId.toString(),
          type: transaction.type,
          quantity: transaction.quantity.toString(),
          price: transaction.price.toString(),
          fee: transaction.fee.toString(),
          transactionDate: transaction.transactionDate,
          assetTicker: transaction.asset.ticker,
        })),
        totalCount,
        page: pageNum,
        pageSize: pageSizeNum,
      },
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Transaction list fetch failed" });
  }
};
