import type {
  AllocationItem,
  AssetListItem,
  PortfolioListItem,
  RebalanceItem,
  PortfolioSummary,
  Transaction,
  TransactionListResponse,
} from "../types";
import { useMockApi } from "./mock-mode";
import * as mockApi from "./mock";

type ApiErrorBody = { error?: string };

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "Empty API response"
        : `API error (${response.status})`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid API response (${response.status}): ${text.slice(0, 120)}`,
    );
  }
}

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
  if (useMockApi()) return mockApi.mockFetchPortfolios();

  const response = await fetch(`${getApiBase()}/portfolios`);
  const data = await parseJsonResponse<PortfolioListItem[] | ApiErrorBody>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      (data as ApiErrorBody).error ?? "Portfolio list load failed",
    );
  }

  return data as PortfolioListItem[];
}

export async function fetchAssets(): Promise<AssetListItem[]> {
  if (useMockApi()) return mockApi.mockFetchAssets();

  const response = await fetch(`${getApiBase()}/assets`);
  const data = await parseJsonResponse<AssetListItem[] | ApiErrorBody>(response);

  if (!response.ok) {
    throw new Error((data as ApiErrorBody).error ?? "Asset list load failed");
  }

  return data as AssetListItem[];
}

export async function fetchPortfolioSummary(
  portfolioId: string
): Promise<PortfolioSummary> {
  if (useMockApi()) return mockApi.mockFetchPortfolioSummary(portfolioId);

  const response = await fetch(`${getApiBase()}/portfolios/${portfolioId}/summary`);
  const data = await parseJsonResponse<PortfolioSummary | ApiErrorBody>(response);

  if (!response.ok) {
    throw new Error((data as ApiErrorBody).error ?? "Portfolio load failed");
  }

  return data as PortfolioSummary;
}

export async function fetchTransactions(
  portfolioId: string,
  page = 1,
  pageSize = 10
): Promise<TransactionListResponse> {
  if (useMockApi()) {
    return mockApi.mockFetchTransactions(portfolioId, page, pageSize);
  }

  const response = await fetch(
    `${getApiBase()}/transactions?portfolioId=${portfolioId}&page=${page}&pageSize=${pageSize}`
  );
  const data = await parseJsonResponse<TransactionListResponse | ApiErrorBody>(
    response,
  );

  if (!response.ok) {
    throw new Error((data as ApiErrorBody).error ?? "Transaction load failed");
  }

  return data as TransactionListResponse;
}

export async function createTransactionApi(input: {
  portfolioId: number;
  assetId: number;
  type: string;
  quantity: number;
  price: number;
}): Promise<Transaction> {
  if (useMockApi()) return mockApi.mockCreateTransaction(input);

  const response = await fetch(`${getApiBase()}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await parseJsonResponse<Transaction | ApiErrorBody>(response);
  if (!response.ok) {
    throw new Error(
      (data as ApiErrorBody).error ?? "Transaction creation failed",
    );
  }

  return data as Transaction;
}

export async function deleteTransactionApi(id: string): Promise<void> {
  if (useMockApi()) {
    mockApi.mockDeleteTransaction(id);
    return;
  }

  const response = await fetch(`${getApiBase()}/transactions/${id}`, {
    method: "DELETE",
  });

  const data = await parseJsonResponse<{ message?: string } | ApiErrorBody>(
    response,
  );
  if (!response.ok) {
    throw new Error(
      (data as ApiErrorBody).error ?? "Transaction deletion failed",
    );
  }
}

export async function fetchAllocations(
  portfolioId: string
): Promise<AllocationItem[]> {
  if (useMockApi()) return mockApi.mockFetchAllocations(portfolioId);

  const response = await fetch(
    `${getApiBase()}/allocations?portfolioId=${portfolioId}`
  );
  const data = await parseJsonResponse<AllocationItem[] | ApiErrorBody>(
    response,
  );
  if (!response.ok) {
    throw new Error((data as ApiErrorBody).error ?? "Allocation load failed");
  }
  return data as AllocationItem[];
}

export async function saveAllocationApi(input: {
  portfolioId: number;
  assetId: number;
  targetRatio: number;
}): Promise<AllocationItem> {
  if (useMockApi()) return mockApi.mockSaveAllocation(input);

  const response = await fetch(`${getApiBase()}/allocations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJsonResponse<AllocationItem | ApiErrorBody>(response);
  if (!response.ok) {
    throw new Error((data as ApiErrorBody).error ?? "Allocation save failed");
  }
  return data as AllocationItem;
}

export async function deleteAllocationApi(id: string): Promise<void> {
  if (useMockApi()) {
    mockApi.mockDeleteAllocation(id);
    return;
  }

  const response = await fetch(`${getApiBase()}/allocations/${id}`, {
    method: "DELETE",
  });
  const data = await parseJsonResponse<{ message?: string } | ApiErrorBody>(
    response,
  );
  if (!response.ok) {
    throw new Error(
      (data as ApiErrorBody).error ?? "Allocation deletion failed",
    );
  }
}

export async function previewRebalanceApi(
  portfolioId: string
): Promise<RebalanceItem[]> {
  if (useMockApi()) return mockApi.mockPreviewRebalance(portfolioId);

  const response = await fetch(
    `${getApiBase()}/portfolios/${portfolioId}/rebalance/preview`,
    {
      method: "POST",
    }
  );
  const data = await parseJsonResponse<RebalanceItem[] | ApiErrorBody>(response);
  if (!response.ok) {
    throw new Error((data as ApiErrorBody).error ?? "Rebalance preview failed");
  }
  return data as RebalanceItem[];
}

export async function applyRebalanceApi(portfolioId: string): Promise<{
  appliedCount: number;
}> {
  if (useMockApi()) return mockApi.mockApplyRebalance(portfolioId);

  const response = await fetch(
    `${getApiBase()}/portfolios/${portfolioId}/rebalance/apply`,
    {
      method: "POST",
    }
  );
  const data = await parseJsonResponse<
    { appliedCount: number } | ApiErrorBody
  >(response);
  if (!response.ok) {
    throw new Error((data as ApiErrorBody).error ?? "Rebalance apply failed");
  }
  return data as { appliedCount: number };
}

