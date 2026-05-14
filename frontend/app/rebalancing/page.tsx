"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar } from "@mui/material";
import { RebalanceSection } from "./components/RebalanceSection";
import { applyRebalanceApi, fetchPortfolioSummary, previewRebalanceApi } from "../lib/api";
import { PORTFOLIO_CHANGED_EVENT, PORTFOLIO_STORAGE_KEY } from "../lib/portfolio";
import type { RebalanceItem } from "../types";

export default function RebalancingPage() {
  const [portfolioId, setPortfolioId] = useState("1");
  const [currency, setCurrency] = useState("JPY");
  const [items, setItems] = useState<RebalanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarKey, setSnackbarKey] = useState(0);

  const notify = (text: string) => {
    setMessage(text);
    setSnackbarOpen(true);
    setSnackbarKey((prev) => prev + 1);
  };

  useEffect(() => {
    const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (saved) {
      setPortfolioId(saved);
    }
  }, []);

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

  useEffect(() => {
    const loadRebalanceData = async () => {
      if (!portfolioId) return;
      setLoading(true);
      try {
        const [summary, preview] = await Promise.all([
          fetchPortfolioSummary(portfolioId),
          previewRebalanceApi(portfolioId),
        ]);
        setCurrency(summary.portfolio.baseCurrency);
        setItems(preview);
      } catch (error) {
        notify(error instanceof Error ? error.message : "Rebalance load failed");
      } finally {
        setLoading(false);
      }
    };
    void loadRebalanceData();
  }, [portfolioId]);

  const onApply = () => {
    if (items.length === 0) {
      notify("適用対象なし（目標比率と現在の比率が同じです）");
      return;
    }
    setApplyConfirmOpen(true);
  };

  const executeApply = async () => {
    setApplyConfirmOpen(false);
    setLoading(true);
    try {
      const result = await applyRebalanceApi(portfolioId);
      notify(`リバランス適用完了 (${result.appliedCount}件)`);
      const preview = await previewRebalanceApi(portfolioId);
      setItems(preview);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Rebalance apply failed");
    } finally {
      setLoading(false);
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
            Rebalancing
          </p>
          <h1 className="section-title mt-1 text-2xl font-bold tracking-tight">
            リバランシング
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            目標比率との差分を確認し、必要な売買をまとめて適用できます。
          </p>
        </div>
      </section>
      <RebalanceSection items={items} currency={currency} loading={loading} onApply={onApply} />
      <Snackbar
        key={`${snackbarKey}-${message}`}
        open={snackbarOpen && Boolean(message)}
        autoHideDuration={2800}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={message.includes("failed") ? "error" : "success"} variant="filled" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
      <Dialog
        open={applyConfirmOpen}
        onClose={() => setApplyConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>リバランス適用の確認</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 16 }}>
            リバランスの結果を本当に適用しますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setApplyConfirmOpen(false)} variant="outlined" size="large">
            いいえ
          </Button>
          <Button onClick={executeApply} color="primary" variant="contained" size="large">
            はい
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
