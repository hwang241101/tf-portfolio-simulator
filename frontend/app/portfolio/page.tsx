"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fade,
  IconButton,
  Snackbar,
  Tooltip,
} from "@mui/material";
import { AllocationSection } from "./components/AllocationSection";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { EtfInfoIcon } from "../components/EtfInfoIcon";
import {
  createTransactionApi,
  deleteTransactionApi,
  deleteAllocationApi,
  fetchAllocations,
  fetchAssets,
  fetchPortfolioSummary,
  fetchTransactions,
  saveAllocationApi,
} from "../lib/api";
import {
  PORTFOLIO_CHANGED_EVENT,
  PORTFOLIO_STORAGE_KEY,
} from "../lib/portfolio";
import {
  PRESET_CUSTOMIZED_KEY,
  PRESET_CHANGED_EVENT,
  PRESET_STORAGE_KEY,
  RISK_PRESETS,
  type RiskPreset,
} from "../lib/presets";
import type { AllocationItem, AssetListItem, Transaction } from "../types";

export default function PortfolioPage() {
  const prevPortfolioIdRef = useRef<string | null>(null);
  const [portfolioId, setPortfolioId] = useState("1");
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [allocationAssetId, setAllocationAssetId] = useState("1");
  const [allocationRatio, setAllocationRatio] = useState("70");
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [assetId, setAssetId] = useState("1");
  const [type, setType] = useState("BUY");
  const [quantity, setQuantity] = useState("10");
  const [price, setPrice] = useState("100");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionTotalCount, setTransactionTotalCount] = useState(0);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPageSize] = useState(10);
  const [currency, setCurrency] = useState("JPY");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarKey, setSnackbarKey] = useState(0);
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const [presetConfirmOpen, setPresetConfirmOpen] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<RiskPreset | null>(null);
  const [activePresetId, setActivePresetId] = useState<RiskPreset["id"] | null>(
    null,
  );
  const [animateBars, setAnimateBars] = useState(false);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>(
    null,
  );

  const notify = (text: string) => {
    setMessage(text);
    setSnackbarOpen(true);
    setSnackbarKey((prev) => prev + 1);
  };

  const canSubmit = useMemo(
    () =>
      Number(portfolioId) > 0 &&
      Number(assetId) > 0 &&
      Number(quantity) > 0 &&
      Number(price) > 0,
    [portfolioId, assetId, quantity, price],
  );
  const activePreset = useMemo(
    () =>
      RISK_PRESETS.find((preset) => preset.id === activePresetId) ??
      RISK_PRESETS[0] ??
      null,
    [activePresetId],
  );

  useEffect(() => {
    if (!activePreset?.id) return;
    setAnimateBars(false);
    const timer = window.setTimeout(() => setAnimateBars(true), 60);
    return () => window.clearTimeout(timer);
  }, [activePreset?.id]);
  const presetTabTone = (presetId: RiskPreset["id"], selected: boolean) => {
    if (presetId === "aggressive") {
      return selected
        ? {
            tab: "border-rose-500/90 bg-rose-100/90 shadow-[0_0_16px_rgba(244,63,94,0.24)]",
            badge: "bg-rose-500/90 text-white",
          }
        : {
            tab: "border-rose-200/80 bg-rose-50/70 hover:border-rose-400/90 hover:bg-rose-100/85",
            badge: "bg-rose-100 text-rose-700",
          };
    }

    if (presetId === "balanced") {
      return selected
        ? {
            tab: "border-amber-500/90 bg-amber-100/90 shadow-[0_0_16px_rgba(245,158,11,0.24)]",
            badge: "bg-amber-500/90 text-white",
          }
        : {
            tab: "border-amber-200/80 bg-amber-50/70 hover:border-amber-400/90 hover:bg-amber-100/85",
            badge: "bg-amber-100 text-amber-700",
          };
    }

    return selected
      ? {
          tab: "border-emerald-500/90 bg-emerald-100/90 shadow-[0_0_16px_rgba(16,185,129,0.22)]",
          badge: "bg-emerald-500/90 text-white",
        }
      : {
          tab: "border-emerald-200/80 bg-emerald-50/70 hover:border-emerald-400/90 hover:bg-emerald-100/85",
          badge: "bg-emerald-100 text-emerald-700",
        };
  };
  const activePanelTone = (presetId: RiskPreset["id"]) => {
    if (presetId === "aggressive") {
      return "border-rose-200/85 bg-rose-50/70";
    }
    if (presetId === "balanced") {
      return "border-amber-200/85 bg-amber-50/70";
    }
    return "border-emerald-200/85 bg-emerald-50/70";
  };
  const selectedCheckTone = (presetId: RiskPreset["id"]) => {
    if (presetId === "aggressive") {
      return "bg-rose-500 text-white";
    }
    if (presetId === "balanced") {
      return "bg-amber-500 text-white";
    }
    return "bg-emerald-500 text-white";
  };
  const suitableChipTone = (presetId: RiskPreset["id"]) => {
    if (presetId === "aggressive") {
      return "border-rose-300/80 bg-rose-100/85 text-rose-800";
    }
    if (presetId === "balanced") {
      return "border-amber-300/80 bg-amber-100/85 text-amber-800";
    }
    return "border-emerald-300/80 bg-emerald-100/85 text-emerald-800";
  };

  const loadOverviewOnly = async (targetPortfolioId: string) => {
    if (!targetPortfolioId) {
      setAllocations([]);
      setCurrency("JPY");
      return;
    }

    const [summaryData, allocationData] = await Promise.all([
      fetchPortfolioSummary(targetPortfolioId),
      fetchAllocations(targetPortfolioId),
    ]);

    setCurrency(summaryData.portfolio.baseCurrency);
    setAllocations(allocationData);
  };

  const loadTransactionsOnly = async (
    targetPortfolioId: string,
    page: number,
    pageSize: number,
  ) => {
    if (!targetPortfolioId) {
      setTransactions([]);
      setTransactionTotalCount(0);
      return;
    }

    const txData = await fetchTransactions(targetPortfolioId, page, pageSize);
    setTransactions(txData.items);
    setTransactionTotalCount(txData.totalCount);
  };

  const loadData = async () => {
    if (!portfolioId) {
      setAllocations([]);
      setTransactions([]);
      setTransactionTotalCount(0);
      setCurrency("JPY");
      return;
    }

    await Promise.all([
      loadOverviewOnly(portfolioId),
      loadTransactionsOnly(portfolioId, transactionPage, transactionPageSize),
    ]);
  };

  const openPresetPicker = () => {
    const currentPresetId = localStorage.getItem(PRESET_STORAGE_KEY);
    const fallbackId = RISK_PRESETS[0]?.id ?? null;
    const matched = RISK_PRESETS.find((preset) => preset.id === currentPresetId);
    setActivePresetId(matched?.id ?? fallbackId);
    setPresetPickerOpen(true);
  };

  const pickPreset = (preset: RiskPreset) => {
    setPendingPreset(preset);
    setPresetPickerOpen(false);
    setPresetConfirmOpen(true);
  };

  const cancelPresetConfirm = () => {
    setPresetConfirmOpen(false);
    setPendingPreset(null);
  };

  const applyPresetToPortfolio = async (preset: RiskPreset) => {
    const missingTickers = preset.allocations
      .filter((row) => !assets.some((a) => a.ticker === row.ticker))
      .map((row) => row.ticker);
    if (missingTickers.length > 0) {
      notify(
        `プリセット内の銘柄が資産一覧にありません: ${missingTickers.join(", ")}`,
      );
      return;
    }

    setLoading(true);
    try {
      const current = await fetchAllocations(portfolioId);
      await Promise.all(current.map((a) => deleteAllocationApi(a.id)));
      for (const row of preset.allocations) {
        const asset = assets.find((a) => a.ticker === row.ticker);
        if (!asset) continue;
        await saveAllocationApi({
          portfolioId: Number(portfolioId),
          assetId: Number(asset.id),
          targetRatio: row.ratio / 100,
        });
      }
      localStorage.setItem(PRESET_STORAGE_KEY, preset.id);
      localStorage.setItem(PRESET_CUSTOMIZED_KEY, "0");
      window.dispatchEvent(new Event(PRESET_CHANGED_EVENT));
      await loadData();
      notify(`プリセット「${preset.label}」を適用しました`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "プリセット適用に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmApplyPreset = async () => {
    if (!pendingPreset) return;
    setPresetConfirmOpen(false);
    await applyPresetToPortfolio(pendingPreset);
    setPendingPreset(null);
  };

  useEffect(() => {
    const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (saved) {
      setPortfolioId(saved);
    }
  }, []);

  useEffect(() => {
    const syncPresetLabel = () => {
      const presetId = localStorage.getItem(PRESET_STORAGE_KEY);
      if (!presetId) {
        setSelectedPresetLabel(null);
        return;
      }
      const matched = RISK_PRESETS.find((preset) => preset.id === presetId);
      const customized = localStorage.getItem(PRESET_CUSTOMIZED_KEY) === "1";
      if (!matched) {
        setSelectedPresetLabel(customized ? "カスタマイズ" : null);
        return;
      }
      setSelectedPresetLabel(
        customized ? "カスタマイズ" : `${matched.label}（プリセット）`,
      );
    };
    syncPresetLabel();
    const onPresetChanged = () => syncPresetLabel();
    window.addEventListener(PRESET_CHANGED_EVENT, onPresetChanged);
    return () =>
      window.removeEventListener(PRESET_CHANGED_EVENT, onPresetChanged);
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
      window.removeEventListener(
        PORTFOLIO_CHANGED_EVENT,
        syncPortfolioSelection,
      );
  }, [portfolioId]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const items = await fetchAssets();
        setAssets(items);
        setAssetId((prev) => {
          if (!items.some((item) => item.id === prev) && items[0]) {
            return items[0].id;
          }
          return prev;
        });
        setAllocationAssetId((prev) => {
          if (!items.some((item) => item.id === prev) && items[0]) {
            return items[0].id;
          }
          return prev;
        });
      } catch (error) {
        notify(
          error instanceof Error ? error.message : "Asset list load failed",
        );
      }
    };
    void loadAssets();
  }, []);

  useEffect(() => {
    const loadByScope = async () => {
      if (!portfolioId) {
        setAllocations([]);
        setTransactions([]);
        setTransactionTotalCount(0);
        setCurrency("JPY");
        return;
      }

      const portfolioChanged = prevPortfolioIdRef.current !== portfolioId;

      if (portfolioChanged) {
        prevPortfolioIdRef.current = portfolioId;
        try {
          await loadOverviewOnly(portfolioId);
        } catch (error) {
          setAllocations([]);
          setCurrency("JPY");
          setMessage(
            error instanceof Error ? error.message : "Allocation load failed",
          );
        }
        if (transactionPage !== 1) {
          setTransactionPage(1);
          return;
        }
      }

      try {
        await loadTransactionsOnly(
          portfolioId,
          transactionPage,
          transactionPageSize,
        );
      } catch (error) {
        setTransactions([]);
        setTransactionTotalCount(0);
        setMessage(
          error instanceof Error ? error.message : "Transaction load failed",
        );
      }
    };
    void loadByScope();
  }, [portfolioId, transactionPage, transactionPageSize]);

  useEffect(() => {
    if (message) {
      setSnackbarOpen(true);
    }
  }, [message]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await createTransactionApi({
        portfolioId: Number(portfolioId),
        assetId: Number(assetId),
        type,
        quantity: Number(quantity),
        price: Number(price),
      });

      notify("取引登録完了");
      await loadData();
    } catch (error) {
      notify("取引登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      await deleteTransactionApi(id);
      setMessage("取引削除完了");
      await loadData();
    } catch (error) {
      setMessage("取引削除に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onSaveAllocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ratioPercent = Number(allocationRatio);
    if (
      !Number.isFinite(ratioPercent) ||
      ratioPercent < 0 ||
      ratioPercent > 100
    ) {
      setMessage("目標比率は0~100の間で入力してください");
      return;
    }

    setLoading(true);
    try {
      await saveAllocationApi({
        portfolioId: Number(portfolioId),
        assetId: Number(allocationAssetId),
        targetRatio: ratioPercent / 100,
      });
      if (localStorage.getItem(PRESET_STORAGE_KEY)) {
        localStorage.setItem(PRESET_CUSTOMIZED_KEY, "1");
      }
      window.dispatchEvent(new Event(PRESET_CHANGED_EVENT));
      setMessage("目標比率保存完了");
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Allocation save failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const onDeleteAllocation = async (id: string) => {
    setMessage("目標比率削除を試行します。");
    setLoading(true);
    try {
      await deleteAllocationApi(id);
      if (localStorage.getItem(PRESET_STORAGE_KEY)) {
        localStorage.setItem(PRESET_CUSTOMIZED_KEY, "1");
      }
      window.dispatchEvent(new Event(PRESET_CHANGED_EVENT));
      setMessage("目標比率削除完了");
      await loadData();
    } catch (error) {
      setMessage("目標比率削除に失敗しました。");
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
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Portfolio
            </p>
            <h1 className="section-title mt-1 text-2xl font-bold tracking-tight">
              ポートフォリオ
            </h1>
            <p className="mt-2 w-full text-sm leading-relaxed text-slate-600">
              目標比率・取引登録・取引履歴をこの画面で管理できます。対象ポートフォリオは左サイドバーで切り替え、プリセットは下のボタンから詳細確認と変更ができます。
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {selectedPresetLabel
                ? "現在のプリセットを確認中です。必要に応じて下のボタンから再選択できます。"
                : "性向プリセットは未設定です。下のボタンから詳細を確認して選択してください。"}
            </p>
            <button
              type="button"
              className="apple-btn mt-3 inline-flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm whitespace-nowrap shadow-sm transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
              onClick={openPresetPicker}
              disabled={loading || assets.length === 0}
            >
              <span>
                {selectedPresetLabel
                  ? `投資性向プリセット: ${selectedPresetLabel}`
                  : "プリセットで目標比率を設定"}
              </span>
              {selectedPresetLabel ? (
                <EditRoundedIcon sx={{ fontSize: 20 }} />
              ) : (
                <TuneRoundedIcon sx={{ fontSize: 20 }} />
              )}
            </button>
          </div>
        </div>
      </section>

      <AllocationSection
        assets={assets}
        allocationAssetId={allocationAssetId}
        allocationRatio={allocationRatio}
        allocations={allocations}
        loading={loading}
        onChangeAllocationAssetId={setAllocationAssetId}
        onChangeAllocationRatio={setAllocationRatio}
        onSubmit={onSaveAllocation}
        onDelete={onDeleteAllocation}
      />

      <TransactionForm
        assetId={assetId}
        type={type}
        quantity={quantity}
        price={price}
        loading={loading}
        assets={assets}
        canSubmit={canSubmit}
        onChangeAssetId={setAssetId}
        onChangeType={setType}
        onChangeQuantity={setQuantity}
        onChangePrice={setPrice}
        onSubmit={onCreate}
      />

      <TransactionList
        transactions={transactions}
        totalCount={transactionTotalCount}
        page={transactionPage}
        pageSize={transactionPageSize}
        currency={currency}
        assetTickers={assets.map((asset) => asset.ticker)}
        loading={loading}
        onDelete={onDeleteTransaction}
        onPageChange={setTransactionPage}
      />

      <Dialog
        open={presetPickerOpen}
        onClose={() => setPresetPickerOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              p: 1,
              minHeight: "78vh",
              maxHeight: "86vh",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: 700,
            color: "#1d4ed8",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <span>投資性向プリセットの選択</span>
          <IconButton
            aria-label="닫기"
            size="small"
            onClick={() => setPresetPickerOpen(false)}
            sx={{ color: "slategray" }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <p className="mb-4 text-sm text-slate-600">
            積極成長型・均衡型・安定型から選びます。確定すると目標比率がプリセット内容で一括更新され、既存の目標比率は置き換わります。ダッシュボードの保有資産（数量・評価額）は、取引登録やリバランスを行うまで変わりません。
          </p>
          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            {RISK_PRESETS.map((preset) => {
              const selected = preset.id === activePreset?.id;
              const tone = presetTabTone(preset.id, selected);
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-left transition-all duration-300 ease-out ${tone.tab} ${
                    selected ? "scale-[1.015]" : "scale-100"
                  }`}
                  onClick={() => setActivePresetId(preset.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={`section-title text-sm font-semibold text-slate-800 transition-all duration-300 ${
                          selected ? "translate-x-0.5" : ""
                        }`}
                      >
                        {preset.label}
                      </p>
                      <p
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all duration-300 ${tone.badge}`}
                      >
                        {preset.metrics.riskLevel}リスク
                      </p>
                    </div>
                    {selected ? (
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-all duration-300 ease-out ${selectedCheckTone(
                          preset.id,
                        )} scale-100 opacity-100`}
                      >
                        <CheckRoundedIcon
                          sx={{ fontSize: 20 }}
                          className="transition-transform duration-300 ease-out"
                        />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {activePreset && (
            <Fade in key={activePreset.id} timeout={320}>
              <div
                className={`min-h-0 flex-1 overflow-y-auto rounded-xl border p-3 ${activePanelTone(
                  activePreset.id,
                )}`}
              >
              <h2 className="section-title text-base font-semibold">
                {activePreset.label}
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                {activePreset.description}
              </p>
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-700">
                  こんな人向け
                </p>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                  {activePreset.suitableFor.map((item) => (
                    <li key={`${activePreset.id}-${item}`}>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-[0_1px_3px_rgba(15,23,42,0.08)] ${suitableChipTone(
                          activePreset.id,
                        )}`}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-2 mt-3 inline-flex items-center gap-1">
                <p className="text-xs font-semibold text-slate-700">
                  資産配分チャート
                </p>
                <Tooltip
                  placement="top"
                  title={
                    <span style={{ lineHeight: 1.5 }}>
                      各プリセットの目標配分を示す参考チャートです。棒が長いほど、
                      そのETFの目標比率が高いことを意味します。
                    </span>
                  }
                >
                  <IconButton size="small" sx={{ color: "grey.500", p: 0.25 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </div>
              <div className="space-y-2">
                {[...activePreset.allocations]
                  .sort((a, b) => b.ratio - a.ratio)
                  .map((item) => (
                  <div key={`${activePreset.id}-${item.ticker}`}>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        {item.ticker}
                        <EtfInfoIcon ticker={item.ticker} />
                      </span>
                      <span>{item.ratio}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-[width] duration-500 ease-out"
                        style={{ width: `${animateBars ? item.ratio : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/85 p-2.5">
                  <p className="text-[11px] font-medium text-slate-500">
                    予想年収益率
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {activePreset.metrics.expectedReturn}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/85 p-2.5">
                  <p className="text-[11px] font-medium text-slate-500">
                    予想MDD
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {activePreset.metrics.expectedMdd}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/85 p-2.5">
                  <p className="text-[11px] font-medium text-slate-500">
                    推奨投資期間
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {activePreset.metrics.recommendedHorizon}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/85 p-2.5">
                  <p className="text-[11px] font-medium text-slate-500">
                    リスク水準
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {activePreset.metrics.riskLevel}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/85 p-2.5">
                  <p className="text-[11px] font-medium text-slate-500">
                    過去10年間バックテスト
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    平均年率 {activePreset.metrics.backtest10yAvgAnnualReturn}
                  </p>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-500">
                ※ 予想値は学習用の参考値であり、将来の収益を保証するものではありません。
              </p>

              <Button
                fullWidth
                size="small"
                variant="contained"
                className="mt-3"
                disabled={loading || assets.length === 0}
                onClick={() => pickPreset(activePreset)}
              >
                このプリセットを選択
              </Button>
              </div>
            </Fade>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={presetConfirmOpen}
        onClose={cancelPresetConfirm}
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
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: 700,
            color: "#1d4ed8",
            letterSpacing: "-0.01em",
          }}
        >
          プリセット適用の確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 16 }}>
            {pendingPreset ? (
              <>
                「{pendingPreset.label}」を適用します。
                <br />
                目標比率がプリセットの内容で一括更新され、既存の目標比率は上書きされます。保有資産（ダッシュボードの保有資産一覧の数量・評価額）は、取引またはリバランス適用まで変わりません。続行しますか？
              </>
            ) : (
              ""
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={cancelPresetConfirm} variant="outlined" size="large">
            いいえ
          </Button>
          <Button
            onClick={() => void confirmApplyPreset()}
            color="primary"
            variant="contained"
            size="large"
            disabled={loading || !pendingPreset}
          >
            はい
          </Button>
        </DialogActions>
      </Dialog>

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
