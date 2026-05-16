import type {
  AllocationItem,
  AssetListItem,
  PortfolioListItem,
  RebalanceItem,
  PortfolioSummary,
  Transaction,
  TransactionListResponse,
} from "../types";

function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    // Vercel(HTTPS) → EB(HTTP) direct calls are blocked (mixed content).
    if (!configured || configured.startsWith("http://")) {
      return "/api-proxy";
    }
  }

  return configured ?? "http://localhost:4000";
}

export async function fetchPortfolios(): Promise<PortfolioListItem[]> {
  const response = await fetch(`${getApiBase()}/portfolios`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Portfolio list load failed");
  }

  return data;
}

export async function fetchAssets(): Promise<AssetListItem[]> {
  const response = await fetch(`${getApiBase()}/assets`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Asset list load failed");
  }

  return data;
}

export async function fetchPortfolioSummary(
  portfolioId: string
): Promise<PortfolioSummary> {
  const response = await fetch(`${getApiBase()}/portfolios/${portfolioId}/summary`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Portfolio load failed");
  }

  return data;
}

export async function fetchTransactions(
  portfolioId: string,
  page = 1,
  pageSize = 10
): Promise<TransactionListResponse> {
  const response = await fetch(
    `${getApiBase()}/transactions?portfolioId=${portfolioId}&page=${page}&pageSize=${pageSize}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Transaction load failed");
  }

  return data;
}

export async function createTransactionApi(input: {
  portfolioId: number;
  assetId: number;
  type: string;
  quantity: number;
  price: number;
}): Promise<Transaction> {
  const response = await fetch(`${getApiBase()}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Transaction creation failed");
  }

  return data;
}

export async function deleteTransactionApi(id: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/transactions/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Transaction deletion failed");
  }
}

export async function fetchAllocations(
  portfolioId: string
): Promise<AllocationItem[]> {
  const response = await fetch(
    `${getApiBase()}/allocations?portfolioId=${portfolioId}`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Allocation load failed");
  }
  return data;
}

export async function saveAllocationApi(input: {
  portfolioId: number;
  assetId: number;
  targetRatio: number;
}): Promise<AllocationItem> {
  const response = await fetch(`${getApiBase()}/allocations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Allocation save failed");
  }
  return data;
}

export async function deleteAllocationApi(id: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/allocations/${id}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Allocation deletion failed");
  }
}

export async function previewRebalanceApi(
  portfolioId: string
): Promise<RebalanceItem[]> {
  const response = await fetch(
    `${getApiBase()}/portfolios/${portfolioId}/rebalance/preview`,
    {
      method: "POST",
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Rebalance preview failed");
  }
  return data;
}

export async function applyRebalanceApi(portfolioId: string): Promise<{
  appliedCount: number;
}> {
  const response = await fetch(
    `${getApiBase()}/portfolios/${portfolioId}/rebalance/apply`,
    {
      method: "POST",
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Rebalance apply failed");
  }
  return data;
}

