import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getMockCurrentPriceByTicker } from "../services/price.service";

export const listPortfolios = async (req: Request, res: Response) => {
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: { user: true },
      orderBy: { id: "asc" },
    });

    res.json(
      portfolios.map((portfolio) => ({
        id: portfolio.id.toString(),
        name: portfolio.name,
        baseCurrency: portfolio.baseCurrency,
        userEmail: portfolio.user.email,
      })),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Portfolio list fetch failed" });
  }
};

export const getPortfolioSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id) || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid portfolio id" });
    }

    const portfolioId = BigInt(id);
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { user: true },
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { portfolioId },
      include: { asset: true },
      orderBy: { transactionDate: "asc" },
    });

    const byAsset = new Map<
      string,
      {
        assetId: string;
        ticker: string;
        netQuantity: number;
        lastPrice: number;
      }
    >();

    // 1) 자산별 순수량(netQuantity)과 마지막 거래가격(lastPrice) 계산
    for (const transaction of transactions) {
      const key = transaction.assetId.toString();
      const signedQty =
        transaction.type.toUpperCase() === "SELL"
          ? -Number(transaction.quantity)
          : Number(transaction.quantity);

      const current = byAsset.get(key) ?? {
        assetId: key,
        ticker: transaction.asset.ticker,
        netQuantity: 0,
        lastPrice: 0,
      };

      current.netQuantity += signedQty;
      current.lastPrice = Number(transaction.price); // 가장 최근 루프 값으로 갱신
      byAsset.set(key, current);
    }

    // 2) 순수량이 0보다 큰 자산만 포지션으로 간주
    const positions = [...byAsset.values()].filter(
      (position) => position.netQuantity > 0,
    );

    const mockPriceByTicker = new Map<string, number>();
    const getCachedMockPrice = (ticker: string, fallback = 100) => {
      const cached = mockPriceByTicker.get(ticker);
      if (cached !== undefined) return cached;
      const price = getMockCurrentPriceByTicker(ticker, fallback);
      mockPriceByTicker.set(ticker, price);
      return price;
    };

    // 3) 평가액 = 순수량 × 현재가격(Mock)
    const totalValue = positions.reduce(
      (sum, position) =>
        sum +
        position.netQuantity *
          getCachedMockPrice(position.ticker, position.lastPrice || 100),
      0,
    );

    // 거래 시퀀스 기준 MDD 근사치 계산
    // - 수량은 거래 누적으로 반영
    // - 평가는 현재가(Mock) 기준으로 반영 (CAGR/총평가액과 동일 가격 소스)
    const runningQtyByAsset = new Map<string, number>();
    const equityCurve: number[] = [];
    const valueHistory: Array<{ date: string; value: number }> = [];
    for (const tx of transactions) {
      const key = tx.assetId.toString();
      const prevQty = runningQtyByAsset.get(key) ?? 0;
      const nextQty =
        tx.type.toUpperCase() === "SELL"
          ? prevQty - Number(tx.quantity)
          : prevQty + Number(tx.quantity);
      runningQtyByAsset.set(key, nextQty);

      let snapshotValue = 0;
      for (const [assetId, qty] of runningQtyByAsset.entries()) {
        if (qty <= 0) continue;
        const ticker = byAsset.get(assetId)?.ticker;
        if (!ticker) continue;
        const price = getCachedMockPrice(ticker, 100);
        snapshotValue += qty * price;
      }
      equityCurve.push(snapshotValue);
      valueHistory.push({
        date: tx.transactionDate.toISOString(),
        value: Number(snapshotValue.toFixed(4)),
      });
    }

    let peak = Number.NEGATIVE_INFINITY;
    let mdd = 0; // 음수값(예: -0.25 = -25%)
    for (const value of equityCurve) {
      if (value > peak) {
        peak = value;
      }
      if (peak > 0) {
        const drawdown = (value - peak) / peak;
        if (drawdown < mdd) {
          mdd = drawdown;
        }
      }
    }

    // CAGR 계산(간단 안정형):
    // 투자원금 = 총 매수금액(BUY 합)
    // CAGR = (현재가치 / 투자원금)^(1/년수) - 1
    const totalBuyAmount = transactions.reduce((sum, tx) => {
      const amount = Number(tx.quantity) * Number(tx.price);
      return tx.type.toUpperCase() === "BUY" ? sum + amount : sum;
    }, 0);

    const firstTxTimestamp = transactions.length
      ? Math.min(...transactions.map((tx) => tx.transactionDate.getTime()))
      : null;
    const years =
      firstTxTimestamp !== null
        ? (Date.now() - firstTxTimestamp) / (1000 * 60 * 60 * 24 * 365.25)
        : 0;
    let cagr: number | null = null;
    if (totalBuyAmount > 0 && years > 0) {
      const ratio = totalValue / totalBuyAmount;
      // 거래 기간이 너무 짧으면 CAGR가 과도하게 왜곡되므로 누적수익률로 fallback
      if (years < 0.25) {
        cagr = ratio - 1;
      } else {
        const rawCagr = Math.pow(ratio, 1 / years) - 1;
        if (Number.isFinite(rawCagr)) {
          cagr = rawCagr;
        } else if (Number.isFinite(ratio)) {
          // 계산값이 비정상일 때도 누적수익률로 fallback
          cagr = ratio - 1;
        }
      }
    }

    res.json({
      portfolio: {
        id: portfolio.id.toString(),
        name: portfolio.name,
        baseCurrency: portfolio.baseCurrency,
        userEmail: portfolio.user.email,
      },
      totalValue,
      positions: positions.map((position) => ({
        assetId: position.assetId,
        ticker: position.ticker,
        netQuantity: position.netQuantity,
        totalValue:
          position.netQuantity *
          getCachedMockPrice(position.ticker, position.lastPrice || 100),
        weight:
          totalValue === 0
            ? 0
            : (position.netQuantity *
                getCachedMockPrice(position.ticker, position.lastPrice || 100)) /
              totalValue,
      })),
      valueHistory,
      transactionCount: transactions.length,
      cagr,
      mdd,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Portfolio summary fetch failed" });
  }
};
