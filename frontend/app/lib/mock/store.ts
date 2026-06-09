import type {
  AllocationItem,
  AssetListItem,
  PortfolioListItem,
  PortfolioSummary,
  RebalanceItem,
  Transaction,
  TransactionListResponse,
} from "../../types";
import {
  INITIAL_ALLOCATIONS,
  INITIAL_TRANSACTIONS,
  MOCK_ASSETS,
  MOCK_PORTFOLIOS,
} from "./initial-data";
import { getMockPrice } from "./prices";

type StoredTransaction = Transaction & {
  portfolioId: string;
  assetId: string;
};

const round4 = (value: number) => Math.round(value * 10000) / 10000;

let transactions: StoredTransaction[] = INITIAL_TRANSACTIONS.map((tx) => ({
  ...tx,
  portfolioId: "1",
  assetId: MOCK_ASSETS.find((asset) => asset.ticker === tx.assetTicker)?.id ?? "1",
}));

let allocations: AllocationItem[] = INITIAL_ALLOCATIONS.map((item) => ({ ...item }));
let nextTxId = 200;
let nextAllocId = 100;
const lastRebalancePlan = new Map<string, RebalanceItem[]>();

function findPortfolio(portfolioId: string): PortfolioListItem | undefined {
  return MOCK_PORTFOLIOS.find((portfolio) => portfolio.id === portfolioId);
}

function findAsset(assetId: string | number): AssetListItem | undefined {
  return MOCK_ASSETS.find((asset) => asset.id === String(assetId));
}

function portfolioTransactions(portfolioId: string): StoredTransaction[] {
  return transactions
    .filter((tx) => tx.portfolioId === portfolioId)
    .sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime(),
    );
}

function buildSummary(portfolioId: string): PortfolioSummary {
  const portfolio = findPortfolio(portfolioId);
  if (!portfolio) {
    throw new Error("Portfolio not found");
  }

  const txs = transactions
    .filter((tx) => tx.portfolioId === portfolioId)
    .sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime(),
    );

  const byAsset = new Map<
    string,
    { assetId: string; ticker: string; netQuantity: number; lastPrice: number }
  >();

  for (const tx of txs) {
    const key = tx.assetId;
    const signedQty =
      tx.type.toUpperCase() === "SELL"
        ? -Number(tx.quantity)
        : Number(tx.quantity);
    const current = byAsset.get(key) ?? {
      assetId: key,
      ticker: tx.assetTicker,
      netQuantity: 0,
      lastPrice: 0,
    };
    current.netQuantity += signedQty;
    current.lastPrice = Number(tx.price);
    byAsset.set(key, current);
  }

  const positions = [...byAsset.values()].filter(
    (position) => position.netQuantity > 0,
  );

  const mockPriceByTicker = new Map<string, number>();
  const getCachedMockPrice = (ticker: string, fallback = 100) => {
    const cached = mockPriceByTicker.get(ticker);
    if (cached !== undefined) return cached;
    const price = getMockPrice(ticker, fallback);
    mockPriceByTicker.set(ticker, price);
    return price;
  };

  const totalValue = positions.reduce(
    (sum, position) =>
      sum +
      position.netQuantity *
        getCachedMockPrice(position.ticker, position.lastPrice || 100),
    0,
  );

  const runningQtyByAsset = new Map<string, number>();
  const equityCurve: number[] = [];
  const valueHistory: Array<{ date: string; value: number }> = [];

  for (const tx of txs) {
    const key = tx.assetId;
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
      snapshotValue += qty * getCachedMockPrice(ticker, 100);
    }
    equityCurve.push(snapshotValue);
    valueHistory.push({
      date: tx.transactionDate,
      value: Number(snapshotValue.toFixed(4)),
    });
  }

  let peak = Number.NEGATIVE_INFINITY;
  let mdd = 0;
  for (const value of equityCurve) {
    if (value > peak) peak = value;
    if (peak > 0) {
      const drawdown = (value - peak) / peak;
      if (drawdown < mdd) mdd = drawdown;
    }
  }

  const totalBuyAmount = txs.reduce((sum, tx) => {
    const amount = Number(tx.quantity) * Number(tx.price);
    return tx.type.toUpperCase() === "BUY" ? sum + amount : sum;
  }, 0);

  const firstTxTimestamp = txs.length
    ? Math.min(...txs.map((tx) => new Date(tx.transactionDate).getTime()))
    : null;
  const years =
    firstTxTimestamp !== null
      ? (Date.now() - firstTxTimestamp) / (1000 * 60 * 60 * 24 * 365.25)
      : 0;

  let cagr: number | null = null;
  if (totalBuyAmount > 0 && years > 0) {
    const ratio = totalValue / totalBuyAmount;
    if (years < 0.25) {
      cagr = ratio - 1;
    } else {
      const rawCagr = Math.pow(ratio, 1 / years) - 1;
      if (Number.isFinite(rawCagr)) {
        cagr = rawCagr;
      } else if (Number.isFinite(ratio)) {
        cagr = ratio - 1;
      }
    }
  }

  return {
    portfolio: {
      id: portfolio.id,
      name: portfolio.name,
      baseCurrency: portfolio.baseCurrency,
      userEmail: portfolio.userEmail,
    },
    totalValue,
    positions: positions.map((position) => {
      const positionValue =
        position.netQuantity *
        getCachedMockPrice(position.ticker, position.lastPrice || 100);
      return {
        assetId: position.assetId,
        ticker: position.ticker,
        netQuantity: position.netQuantity,
        totalValue: positionValue,
        weight: totalValue === 0 ? 0 : positionValue / totalValue,
      };
    }),
    valueHistory,
    transactionCount: txs.length,
    cagr,
    mdd,
  };
}

function buildRebalancePlan(portfolioId: string): RebalanceItem[] {
  const portfolioAllocations = allocations.filter(
    (allocation) => allocation.portfolioId === portfolioId,
  );
  if (portfolioAllocations.length === 0) return [];

  const totalTarget = portfolioAllocations.reduce(
    (sum, allocation) => sum + Number(allocation.targetRatio),
    0,
  );
  if (totalTarget <= 0) return [];

  const txs = transactions
    .filter((tx) => tx.portfolioId === portfolioId)
    .sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime(),
    );

  const byAsset = new Map<
    string,
    { ticker: string; netQuantity: number; lastPrice: number }
  >();

  for (const tx of txs) {
    const key = tx.assetId;
    const current = byAsset.get(key) ?? {
      ticker: tx.assetTicker,
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
    .filter((value) => value.netQuantity > 0)
    .reduce(
      (sum, value) =>
        sum +
        value.netQuantity *
          getMockPrice(value.ticker, value.lastPrice > 0 ? value.lastPrice : 100),
      0,
    );

  if (totalValue <= 0) return [];

  const targetByAssetId = new Map(
    portfolioAllocations.map((allocation) => [
      allocation.assetId,
      Number(allocation.targetRatio),
    ]),
  );

  const assetIdsToProcess = new Set([
    ...portfolioAllocations.map((allocation) => allocation.assetId),
    ...[...byAsset.entries()]
      .filter(([, value]) => value.netQuantity > 0)
      .map(([assetId]) => assetId),
  ]);

  const plan: RebalanceItem[] = [];

  for (const key of assetIdsToProcess) {
    const targetRatioDecimal = targetByAssetId.get(key) ?? 0;
    const allocation = portfolioAllocations.find((item) => item.assetId === key);
    const held = byAsset.get(key);
    const ticker = held?.ticker ?? allocation?.assetTicker;
    if (!ticker) continue;

    const current = held ?? {
      ticker,
      netQuantity: 0,
      lastPrice: 100,
    };
    const price = getMockPrice(
      current.ticker,
      current.lastPrice > 0 ? current.lastPrice : 100,
    );
    const currentValue = Math.max(0, current.netQuantity) * price;
    const targetValue = totalValue * targetRatioDecimal;
    const diff = targetValue - currentValue;
    const currentRatio = round4((currentValue / totalValue) * 100);
    const targetRatio = round4(targetRatioDecimal * 100);

    if (Math.abs(diff) < 0.01) continue;

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

export function mockFetchPortfolios(): PortfolioListItem[] {
  return MOCK_PORTFOLIOS;
}

export function mockFetchAssets(): AssetListItem[] {
  return MOCK_ASSETS;
}

export function mockFetchPortfolioSummary(portfolioId: string): PortfolioSummary {
  return buildSummary(portfolioId);
}

export function mockFetchTransactions(
  portfolioId: string,
  page = 1,
  pageSize = 10,
): TransactionListResponse {
  const items = portfolioTransactions(portfolioId);
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice.map(({ id, assetTicker, type, quantity, price, transactionDate }) => ({
      id,
      assetTicker,
      type,
      quantity,
      price,
      transactionDate,
    })),
    totalCount: items.length,
    page,
    pageSize,
  };
}

export function mockCreateTransaction(input: {
  portfolioId: number;
  assetId: number;
  type: string;
  quantity: number;
  price: number;
}): Transaction {
  const portfolioId = String(input.portfolioId);
  if (!findPortfolio(portfolioId)) {
    throw new Error("Portfolio not found");
  }

  const asset = findAsset(input.assetId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const tx: StoredTransaction = {
    id: String(nextTxId++),
    portfolioId,
    assetId: asset.id,
    assetTicker: asset.ticker,
    type: input.type.toUpperCase(),
    quantity: String(input.quantity),
    price: String(input.price),
    transactionDate: new Date().toISOString(),
  };
  transactions.push(tx);

  return {
    id: tx.id,
    assetTicker: tx.assetTicker,
    type: tx.type,
    quantity: tx.quantity,
    price: tx.price,
    transactionDate: tx.transactionDate,
  };
}

export function mockDeleteTransaction(id: string): void {
  const index = transactions.findIndex((tx) => tx.id === id);
  if (index === -1) {
    throw new Error("Transaction not found");
  }
  transactions.splice(index, 1);
}

export function mockFetchAllocations(portfolioId: string): AllocationItem[] {
  if (!findPortfolio(portfolioId)) {
    throw new Error("Portfolio not found");
  }
  return allocations
    .filter((allocation) => allocation.portfolioId === portfolioId)
    .map((allocation) => ({ ...allocation }));
}

export function mockSaveAllocation(input: {
  portfolioId: number;
  assetId: number;
  targetRatio: number;
}): AllocationItem {
  const portfolioId = String(input.portfolioId);
  if (!findPortfolio(portfolioId)) {
    throw new Error("Portfolio not found");
  }

  const asset = findAsset(input.assetId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const existing = allocations.find(
    (allocation) =>
      allocation.portfolioId === portfolioId &&
      allocation.assetId === asset.id,
  );

  if (existing) {
    existing.targetRatio = String(input.targetRatio);
    return { ...existing };
  }

  const created: AllocationItem = {
    id: String(nextAllocId++),
    portfolioId,
    assetId: asset.id,
    targetRatio: String(input.targetRatio),
    assetTicker: asset.ticker,
  };
  allocations.push(created);
  return { ...created };
}

export function mockDeleteAllocation(id: string): void {
  const index = allocations.findIndex((allocation) => allocation.id === id);
  if (index === -1) {
    throw new Error("Allocation not found");
  }
  allocations.splice(index, 1);
}

export function mockPreviewRebalance(portfolioId: string): RebalanceItem[] {
  if (!findPortfolio(portfolioId)) {
    throw new Error("Portfolio not found");
  }
  const plan = buildRebalancePlan(portfolioId);
  lastRebalancePlan.set(portfolioId, plan);
  return plan;
}

export function mockApplyRebalance(portfolioId: string): { appliedCount: number } {
  if (!findPortfolio(portfolioId)) {
    throw new Error("Portfolio not found");
  }
  const plan = lastRebalancePlan.get(portfolioId) ?? buildRebalancePlan(portfolioId);
  if (plan.length === 0) {
    return { appliedCount: 0 };
  }

  const now = new Date().toISOString();
  for (const item of plan) {
    transactions.push({
      id: String(nextTxId++),
      portfolioId,
      assetId: item.assetId,
      assetTicker: item.assetTicker,
      type: item.action,
      quantity: String(item.quantity),
      price: String(item.price),
      transactionDate: now,
    });
  }

  lastRebalancePlan.delete(portfolioId);
  return { appliedCount: plan.length };
}
