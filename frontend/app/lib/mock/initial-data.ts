import type {
  AllocationItem,
  AssetListItem,
  PortfolioListItem,
  Transaction,
} from "../../types";

export const MOCK_PORTFOLIOS: PortfolioListItem[] = [
  {
    id: "1",
    name: "Demo Portfolio",
    baseCurrency: "JPY",
    userEmail: "demo@etf.local",
  },
];

export const MOCK_ASSETS: AssetListItem[] = [
  { id: "1", name: "Vanguard S&P 500 ETF", ticker: "VOO", currency: "USD" },
  { id: "2", name: "Vanguard Total World Stock ETF", ticker: "VT", currency: "USD" },
  { id: "3", name: "Vanguard Total Bond Market ETF", ticker: "BND", currency: "USD" },
  { id: "4", name: "SPDR S&P 500 ETF Trust", ticker: "SPY", currency: "USD" },
  { id: "5", name: "Invesco QQQ Trust", ticker: "QQQ", currency: "USD" },
  { id: "6", name: "Vanguard Total Stock Market ETF", ticker: "VTI", currency: "USD" },
  { id: "25", name: "iShares Core U.S. Aggregate Bond ETF", ticker: "AGG", currency: "USD" },
  { id: "35", name: "iShares Gold Trust", ticker: "IAU", currency: "USD" },
];

function weeksAgo(weeks: number): string {
  const date = new Date();
  date.setDate(date.getDate() - weeks * 7);
  return date.toISOString();
}

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "101",
    assetTicker: "VOO",
    type: "BUY",
    quantity: "12.5",
    price: "410.2",
    transactionDate: weeksAgo(48),
  },
  {
    id: "102",
    assetTicker: "QQQ",
    type: "BUY",
    quantity: "8",
    price: "380.5",
    transactionDate: weeksAgo(44),
  },
  {
    id: "103",
    assetTicker: "VT",
    type: "BUY",
    quantity: "20",
    price: "95.1",
    transactionDate: weeksAgo(40),
  },
  {
    id: "104",
    assetTicker: "BND",
    type: "BUY",
    quantity: "30",
    price: "68.4",
    transactionDate: weeksAgo(36),
  },
  {
    id: "105",
    assetTicker: "VOO",
    type: "BUY",
    quantity: "6",
    price: "455.8",
    transactionDate: weeksAgo(32),
  },
  {
    id: "106",
    assetTicker: "VTI",
    type: "BUY",
    quantity: "10",
    price: "240.2",
    transactionDate: weeksAgo(28),
  },
  {
    id: "107",
    assetTicker: "QQQ",
    type: "BUY",
    quantity: "4",
    price: "490.1",
    transactionDate: weeksAgo(24),
  },
  {
    id: "108",
    assetTicker: "AGG",
    type: "BUY",
    quantity: "15",
    price: "92.3",
    transactionDate: weeksAgo(20),
  },
  {
    id: "109",
    assetTicker: "VOO",
    type: "BUY",
    quantity: "5",
    price: "510.6",
    transactionDate: weeksAgo(16),
  },
  {
    id: "110",
    assetTicker: "IAU",
    type: "BUY",
    quantity: "25",
    price: "58.2",
    transactionDate: weeksAgo(12),
  },
  {
    id: "111",
    assetTicker: "VT",
    type: "BUY",
    quantity: "8",
    price: "112.4",
    transactionDate: weeksAgo(8),
  },
  {
    id: "112",
    assetTicker: "BND",
    type: "BUY",
    quantity: "12",
    price: "71.9",
    transactionDate: weeksAgo(4),
  },
];

export const INITIAL_ALLOCATIONS: AllocationItem[] = [
  {
    id: "1",
    portfolioId: "1",
    assetId: "1",
    targetRatio: "0.3",
    assetTicker: "VOO",
  },
  {
    id: "2",
    portfolioId: "1",
    assetId: "2",
    targetRatio: "0.25",
    assetTicker: "VT",
  },
  {
    id: "3",
    portfolioId: "1",
    assetId: "3",
    targetRatio: "0.25",
    assetTicker: "BND",
  },
  {
    id: "4",
    portfolioId: "1",
    assetId: "25",
    targetRatio: "0.1",
    assetTicker: "AGG",
  },
  {
    id: "5",
    portfolioId: "1",
    assetId: "35",
    targetRatio: "0.1",
    assetTicker: "IAU",
  },
];
