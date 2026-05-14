import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const listAssets = async (req: Request, res: Response) => {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { ticker: "asc" },
    });

    res.json(
      assets.map((asset) => ({
        id: asset.id.toString(),
        name: asset.name,
        ticker: asset.ticker,
        currency: asset.currency,
      })),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Asset list fetch failed" });
  }
};

