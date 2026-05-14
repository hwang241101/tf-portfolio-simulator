"use client";

import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { PortfolioSummary } from "./types";
import {
  fetchPortfolios,
  fetchPortfolioSummary,
} from "./lib/api";
import { PortfolioSummarySection } from "./dashboard/components/PortfolioSummarySection";
import { PORTFOLIO_CHANGED_EVENT, PORTFOLIO_STORAGE_KEY } from "./lib/portfolio";

export default function Home() {
  const [portfolioId, setPortfolioId] = useState("1");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarKey, setSnackbarKey] = useState(0);
  const [summaryRefreshing, setSummaryRefreshing] = useState(false);

  const notify = (text: string) => {
    setMessage(text);
    setSnackbarOpen(true);
    setSnackbarKey((prev) => prev + 1);
  };

  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        const items = await fetchPortfolios();
        const savedPortfolioId = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
        if (savedPortfolioId && items.some((item) => item.id === savedPortfolioId)) {
          setPortfolioId(savedPortfolioId);
        } else if (!items.some((item) => item.id === portfolioId) && items[0]) {
          setPortfolioId(items[0].id);
          localStorage.setItem(PORTFOLIO_STORAGE_KEY, items[0].id);
        }
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Portfolio list load failed",
        );
      }
    };
    void loadPortfolios();
  }, []);

  useEffect(() => {
    const loadSummaryOnly = async () => {
      if (!portfolioId) {
        setSummary(null);
        setSummaryLoading(false);
        return;
      }
      setSummaryLoading(true);
      setSummary(null);
      try {
        const summaryData = await fetchPortfolioSummary(portfolioId);
        setSummary(summaryData);
      } catch (error) {
        setSummary(null);
        setMessage(error instanceof Error ? error.message : "Load failed");
      } finally {
        setSummaryLoading(false);
      }
    };

    void loadSummaryOnly();
  }, [portfolioId]);

  useEffect(() => {
    if (message) {
      setSnackbarOpen(true);
    }
  }, [message]);

  useEffect(() => {
    const syncPortfolioSelection = () => {
      const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (saved && saved !== portfolioId) {
        setPortfolioId(saved);
      }
    };
    window.addEventListener(PORTFOLIO_CHANGED_EVENT, syncPortfolioSelection);
    return () =>
      window.removeEventListener(PORTFOLIO_CHANGED_EVENT, syncPortfolioSelection);
  }, [portfolioId]);

  const onRefreshSummaryOnly = async () => {
    setSummaryRefreshing(true);
    try {
      const summaryData = await fetchPortfolioSummary(portfolioId);
      setSummary(summaryData);
      notify("ポートフォリオ要約を更新しました");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Portfolio summary refresh failed",
      );
    } finally {
      setSummaryRefreshing(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-6 p-6">
      <section className="glass-card overflow-hidden">
        <div
          className="h-0.5 w-full bg-gradient-to-r from-blue-300/70 via-sky-400/50 to-indigo-400/60"
          aria-hidden
        />
        <div className="page-hero-body p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Dashboard
          </p>
          <h1 className="section-title mt-1 text-2xl font-bold tracking-tight">
            ダッシュボード
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            現在のポートフォリオ状況を要約し、資産構成・推移・主要指標を確認できます。
          </p>
        </div>
      </section>
      <PortfolioSummarySection
        summary={summary}
        loading={summaryLoading}
        onRefresh={onRefreshSummaryOnly}
        refreshing={summaryRefreshing}
      />
      <Snackbar
        key={`${snackbarKey}-${message}`}
        open={snackbarOpen && Boolean(message)}
        autoHideDuration={2800}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={
            message.includes("failed") ||
            message.includes("失敗") ||
            message.includes("Invalid") ||
            message.includes("入力してください") ||
            message.includes("超えることはできません")
              ? "error"
              : "success"
          }
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </main>
  );
}
