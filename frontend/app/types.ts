export type Transaction = {
  id: string;
  assetTicker: string;
  type: string;
  quantity: string;
  price: string;
  transactionDate: string;
};

export type TransactionListResponse = {
  items: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type Position = {
  assetId: string;
  ticker: string;
  netQuantity: number;
  totalValue: number;
  weight: number;
};

export type PortfolioSummary = {
  portfolio: {
    id: string;
    name: string;
    baseCurrency: string;
    userEmail: string;
  };
  totalValue: number;
  positions: Position[];
  valueHistory: Array<{ date: string; value: number }>;
  transactionCount: number;
  cagr: number | null;
  mdd: number;
};

export type PortfolioListItem = {
  id: string;
  name: string;
  baseCurrency: string;
  userEmail: string;
};

export type AssetListItem = {
  id: string;
  name: string;
  ticker: string;
  currency: string;
};

export type AllocationItem = {
  id: string;
  portfolioId: string;
  assetId: string;
  targetRatio: string;
  assetTicker: string;
};

export type RebalanceItem = {
  assetId: string;
  assetTicker: string;
  action: "BUY" | "SELL";
  currentRatio: number;
  targetRatio: number;
  quantity: number;
  price: number;
  amount: number;
};
