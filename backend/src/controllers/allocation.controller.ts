import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const upsertAllocation = async (req: Request, res: Response) => {
  try {
    const { portfolioId, assetId, targetRatio } = req.body;

    if (!portfolioId || !assetId || targetRatio === undefined) {
      return res.status(400).json({
        error: "portfolioId, assetId, targetRatio are required",
      });
    }

    const ratio = Number(targetRatio);
    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
      return res
        .status(400)
        .json({ error: "targetRatio must be between 0 and 1" });
    }

    const currentPortfolioId = BigInt(portfolioId);
    const currentAssetId = BigInt(assetId);

    const otherAllocations = await prisma.allocation.findMany({
      where: {
        portfolioId: currentPortfolioId,
        NOT: { assetId: currentAssetId },
      },
      select: { targetRatio: true },
    });
    const otherTotal = otherAllocations.reduce(
      (sum, item) => sum + Number(item.targetRatio),
      0,
    );
    const nextTotal = otherTotal + ratio;

    if (nextTotal > 1 + Number.EPSILON) {
      return res.status(400).json({
        error: "目標比率の合計は100%を超えることはできません。",
      });
    }

    const allocation = await prisma.allocation.upsert({
      where: {
        portfolioId_assetId: {
          portfolioId: currentPortfolioId,
          assetId: currentAssetId,
        },
      },
      update: {
        targetRatio: ratio,
      },
      create: {
        portfolioId: currentPortfolioId,
        assetId: currentAssetId,
        targetRatio: ratio,
      },
      include: {
        asset: true,
      },
    });

    res.status(201).json({
      id: allocation.id.toString(),
      portfolioId: allocation.portfolioId.toString(),
      assetId: allocation.assetId.toString(),
      targetRatio: allocation.targetRatio.toString(),
      assetTicker: allocation.asset.ticker,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Allocation save failed" });
  }
};

export const listAllocations = async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.query;
    if (
      !portfolioId ||
      typeof portfolioId !== "string" ||
      !/^\d+$/.test(portfolioId)
    ) {
      return res.status(400).json({ error: "Invalid portfolioId query" });
    }

    const allocations = await prisma.allocation.findMany({
      where: { portfolioId: BigInt(portfolioId) },
      include: { asset: true },
      orderBy: { id: "asc" },
    });

    res.json(
      allocations.map((allocation) => ({
        id: allocation.id.toString(),
        portfolioId: allocation.portfolioId.toString(),
        assetId: allocation.assetId.toString(),
        targetRatio: allocation.targetRatio.toString(),
        assetTicker: allocation.asset.ticker,
      })),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Allocation list fetch failed" });
  }
};

export const deleteAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id) || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid allocation id" });
    }

    const existing = await prisma.allocation.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    await prisma.allocation.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: "Allocation deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Allocation deletion failed" });
  }
};
