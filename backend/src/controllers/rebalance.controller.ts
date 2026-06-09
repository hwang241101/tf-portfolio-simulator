import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getMockCurrentPriceByTicker } from "../services/price.service";

type RebalanceAction = {
  assetId: string;
  assetTicker: string;
  action: "BUY" | "SELL";
  currentRatio: number;
  targetRatio: number;
  quantity: number;
  price: number;
  amount: number;
};

const round4 = (value: number) => Math.round(value * 10000) / 10000;

async function buildRebalancePlan(
  portfolioId: bigint,
): Promise<RebalanceAction[]> {
  const [allocations, transactions] = await Promise.all([
    prisma.allocation.findMany({
      where: { portfolioId },
      include: { asset: true },
    }),
    prisma.transaction.findMany({
      where: { portfolioId },
      include: { asset: true },
      orderBy: { transactionDate: "asc" },
    }),
  ]);

  if (allocations.length === 0) {
    return [];
  }

  const totalTarget = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.targetRatio),
    0,
  );
  if (totalTarget <= 0) {
    return [];
  }

  const byAsset = new Map<
    string,
    { ticker: string; netQuantity: number; lastPrice: number }
  >();

  for (const tx of transactions) {
    const key = tx.assetId.toString();
    const current = byAsset.get(key) ?? {
      ticker: tx.asset.ticker,
      netQuantity: 0,
      lastPrice: 100,
    };
    current.netQuantity +=
      tx.type.toUpperCase() === "SELL"
        ? -Number(tx.quantity)
        : Number(tx.quantity);
    current.lastPrice = Number(tx.price) || current.lastPrice;
    byAsset.set(key, current);
  }

  const totalValue = [...byAsset.values()]
    .filter((v) => v.netQuantity > 0)
    .reduce(
      (sum, v) =>
        sum +
        v.netQuantity *
          getMockCurrentPriceByTicker(
            v.ticker,
            v.lastPrice > 0 ? v.lastPrice : 100,
          ),
      0,
    );

  if (totalValue <= 0) {
    return [];
  }

  const targetByAssetId = new Map(
    allocations.map((allocation) => [
      allocation.assetId.toString(),
      Number(allocation.targetRatio),
    ]),
  );

  const assetIdsToProcess = new Set([
    ...allocations.map((allocation) => allocation.assetId.toString()),
    ...[...byAsset.entries()]
      .filter(([, value]) => value.netQuantity > 0)
      .map(([assetId]) => assetId),
  ]);

  const plan: RebalanceAction[] = [];

  for (const key of assetIdsToProcess) {
    const targetRatioDecimal = targetByAssetId.get(key) ?? 0;
    const allocation = allocations.find(
      (item) => item.assetId.toString() === key,
    );
    const held = byAsset.get(key);
    const ticker = held?.ticker ?? allocation?.asset.ticker;
    if (!ticker) continue;

    const current = held ?? {
      ticker,
      netQuantity: 0,
      lastPrice: 100,
    };
    const price = getMockCurrentPriceByTicker(
      current.ticker,
      current.lastPrice > 0 ? current.lastPrice : 100,
    );
    const currentValue = Math.max(0, current.netQuantity) * price;
    const targetValue = totalValue * targetRatioDecimal;
    const diff = targetValue - currentValue;
    const currentRatio = round4((currentValue / totalValue) * 100);
    const targetRatio = round4(targetRatioDecimal * 100);

    // 소액 노이즈는 제외
    if (Math.abs(diff) < 0.01) {
      continue;
    }

    if (diff > 0) {
      const qty = round4(diff / price);
      if (qty <= 0) continue;
      plan.push({
        assetId: key,
        assetTicker: current.ticker,
        action: "BUY",
        currentRatio,
        targetRatio,
        quantity: qty,
        price,
        amount: round4(qty * price),
      });
    } else {
      const rawSellQty = Math.abs(diff) / price;
      const sellQty = round4(
        Math.min(rawSellQty, Math.max(0, current.netQuantity)),
      );
      if (sellQty <= 0) continue;
      plan.push({
        assetId: key,
        assetTicker: current.ticker,
        action: "SELL",
        currentRatio,
        targetRatio,
        quantity: sellQty,
        price,
        amount: round4(sellQty * price),
      });
    }
  }

  return plan;
}

export const previewRebalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id) || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid portfolio id" });
    }

    const portfolioId = BigInt(id);
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const plan = await buildRebalancePlan(portfolioId);
    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Rebalance preview failed" });
  }
};

export const applyRebalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id) || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid portfolio id" });
    }

    const portfolioId = BigInt(id);
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const plan = await buildRebalancePlan(portfolioId);
    if (plan.length === 0) {
      return res.json({ appliedCount: 0, transactions: [] });
    }

    const created = [];
    for (const item of plan) {
      const tx = await prisma.transaction.create({
        data: {
          portfolioId,
          assetId: BigInt(item.assetId),
          type: item.action,
          quantity: item.quantity,
          price: item.price,
          transactionDate: new Date(),
        },
      });
      created.push({
        id: tx.id.toString(),
        portfolioId: tx.portfolioId.toString(),
        assetId: tx.assetId.toString(),
        type: tx.type,
        quantity: tx.quantity.toString(),
        price: tx.price.toString(),
      });
    }

    res.json({
      appliedCount: created.length,
      transactions: created,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Rebalance apply failed" });
  }
};
