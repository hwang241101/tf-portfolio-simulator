"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PortfolioSummary } from "../../types";
import {
  PRESET_CUSTOMIZED_KEY,
  PRESET_CHANGED_EVENT,
  PRESET_STORAGE_KEY,
  RISK_PRESETS,
} from "../../lib/presets";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  Chip,
  CircularProgress,
  IconButton,
  NoSsr,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { EtfInfoIcon } from "../../components/EtfInfoIcon";

type Props = {
  summary: PortfolioSummary | null;
  loading: boolean;
  onRefresh(): void;
  refreshing: boolean;
};

type HistoryRange = "1M" | "3M" | "1Y" | "ALL";

export function PortfolioSummarySection({
  summary,
  loading,
  onRefresh,
  refreshing,
}: Props) {
  const { ref, visible } = useScrollReveal();
  const hoverCardSx = {
    transition: "background-color 180ms ease, box-shadow 180ms ease",
    "&:hover": {
      backgroundColor: "rgba(33, 150, 243, 0.08)",
      outline: "1px solid rgba(33, 150, 243, 0.6)",
      outlineOffset: "-1px",
      boxShadow: "0 0 10px rgba(33, 150, 243, 0.22)",
    },
  };

  const tableRowHoverSx = {
    transition:
      "background-color 180ms ease, box-shadow 180ms ease, outline-color 180ms ease, transform 180ms ease",
    "&:hover": {
      backgroundColor: "rgba(33, 150, 243, 0.08)",
      outline: "1px solid rgba(33, 150, 243, 0.6)",
      outlineOffset: "-1px",
      boxShadow: "0 0 10px rgba(33, 150, 243, 0.22)",
      transform: "translateY(-1px)",
      "& .MuiTableCell-root": {
        color: "#0f2749",
        fontWeight: 600,
      },
    },
  };

  const [chartVisible, setChartVisible] = useState(false);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("ALL");
  const [historyChartVisible, setHistoryChartVisible] = useState(true);
  const [presetLabel, setPresetLabel] = useState<string | null>(null);

  const syncPresetFromStorage = () => {
    const presetId = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!presetId) {
      setPresetLabel(null);
      return;
    }
    const customized = localStorage.getItem(PRESET_CUSTOMIZED_KEY) === "1";
    const matched = RISK_PRESETS.find((preset) => preset.id === presetId);
    if (!matched) {
      setPresetLabel(customized ? "カスタマイズ" : null);
      return;
    }
    setPresetLabel(
      customized ? "カスタマイズ" : `${matched.label}（プリセット）`,
    );
  };

  const formatUpTo4 = (value: number) =>
    Number(value.toFixed(4)).toLocaleString("en-US", {
      maximumFractionDigits: 4,
    });
  const formatTruncated = (value: number) =>
    Math.trunc(value).toLocaleString("en-US");
  const getRatioBarColor = (percent: number) => {
    if (percent >= 30) return "bg-blue-600";
    if (percent >= 15) return "bg-blue-500";
    if (percent >= 5) return "bg-sky-500";
    return "bg-slate-400";
  };

  const palette = ["#1976d2", "#9c27b0", "#2e7d32", "#ed6c02", "#d32f2f"];
  const renderInfoButton = (text: string) => (
    <Tooltip
      placement="top"
      title={
        <span style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{text}</span>
      }
    >
      <IconButton size="small" sx={{ color: "grey.500" }}>
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
  const renderAssetInfoButton = (ticker: string) => (
    <EtfInfoIcon ticker={ticker} />
  );

  const sortedPositions = summary
    ? [...summary.positions].sort((a, b) => b.weight - a.weight)
    : [];
  const chartPositions = useMemo(() => {
    if (sortedPositions.length <= 10) {
      return sortedPositions.map((position) => ({
        id: position.assetId,
        label: position.ticker,
        value: Number((position.weight * 100).toFixed(4)),
      }));
    }

    const top7 = sortedPositions.slice(0, 7).map((position) => ({
      id: position.assetId,
      label: position.ticker,
      value: Number((position.weight * 100).toFixed(4)),
    }));
    const restValue = sortedPositions
      .slice(10)
      .reduce((sum, position) => sum + position.weight * 100, 0);

    return [
      ...top7,
      {
        id: "others",
        label: "その他",
        value: Number(restValue.toFixed(4)),
      },
    ];
  }, [sortedPositions]);
  const filteredHistory = useMemo(() => {
    if (!summary) return [];
    const sorted = [...summary.valueHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    if (historyRange === "ALL") return sorted;
    if (summary.valueHistory.length === 0) return [];

    const latest = new Date(sorted[sorted.length - 1].date);
    const cutoff = new Date(latest);
    if (historyRange === "1M") cutoff.setMonth(cutoff.getMonth() - 1);
    if (historyRange === "3M") cutoff.setMonth(cutoff.getMonth() - 3);
    if (historyRange === "1Y") cutoff.setFullYear(cutoff.getFullYear() - 1);
    return sorted.filter((item) => new Date(item.date) >= cutoff);
  }, [summary, historyRange]);
  const historyDates = filteredHistory.map((item) => new Date(item.date));
  const historyValues = filteredHistory.map((item) => item.value);
  const allHistoryValues =
    summary?.valueHistory.map((item) => item.value) ?? [];
  const historyStats = useMemo(() => {
    if (filteredHistory.length === 0) {
      return null;
    }
    const start = filteredHistory[0].value;
    let min = filteredHistory[0].value;
    let max = filteredHistory[0].value;
    for (const item of filteredHistory) {
      if (item.value < min) min = item.value;
      if (item.value > max) max = item.value;
    }
    return { start, min, max };
  }, [filteredHistory]);
  const riskSnapshot = useMemo(() => {
    const mddPct = (summary?.mdd ?? 0) * 100;
    const mddLevel = mddPct <= -25 ? "HIGH" : mddPct <= -15 ? "MEDIUM" : "LOW";
    if (!summary || allHistoryValues.length < 2) {
      return {
        level: mddLevel,
        volatilityPct: 0,
        sharpe: 0,
        mddPct,
        mddLevel,
        volatilityLevel: "LOW" as const,
        sharpeLevel: "LOW" as const,
      };
    }
    const returns: number[] = [];
    for (let i = 1; i < allHistoryValues.length; i += 1) {
      const prev = allHistoryValues[i - 1];
      const cur = allHistoryValues[i];
      if (prev > 0) returns.push(cur / prev - 1);
    }
    if (returns.length === 0) {
      return {
        level: mddLevel,
        volatilityPct: 0,
        sharpe: 0,
        mddPct,
        mddLevel,
        volatilityLevel: "LOW" as const,
        sharpeLevel: "LOW" as const,
      };
    }
    const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;
    const variance =
      returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length;
    const stdev = Math.sqrt(variance);
    const annualFactor = Math.sqrt(252);
    const volatilityPct = stdev * annualFactor * 100;
    const sharpe = stdev > 0 ? (mean / stdev) * annualFactor : 0;
    const volatilityLevel =
      volatilityPct >= 22 ? "HIGH" : volatilityPct >= 15 ? "MEDIUM" : "LOW";
    const sharpeLevel = sharpe < 0.7 ? "HIGH" : sharpe < 1 ? "MEDIUM" : "LOW";
    const level =
      mddLevel === "HIGH" ||
      volatilityLevel === "HIGH" ||
      sharpeLevel === "HIGH"
        ? "HIGH"
        : mddLevel === "MEDIUM" ||
            volatilityLevel === "MEDIUM" ||
            sharpeLevel === "MEDIUM"
          ? "MEDIUM"
          : "LOW";
    return {
      level,
      volatilityPct,
      sharpe,
      mddPct,
      mddLevel,
      volatilityLevel,
      sharpeLevel,
    };
  }, [summary, allHistoryValues]);
  const aiInsightOneLiner = useMemo(() => {
    if (riskSnapshot.level === "HIGH") {
      if (riskSnapshot.mddPct <= -25) {
        return "MDDが大きいため、債券比率を増やして下落耐性を強化するのが有効です。";
      }
      if (riskSnapshot.volatilityPct >= 22) {
        return "変動性が高いため、高ボラ資産比率を一部下げて分散を強化するのがおすすめです。";
      }
      return "リスク効率が低下しているため、低相関資産を加えた再配分を検討してください。";
    }
    if (riskSnapshot.level === "MEDIUM") {
      return "現在は中程度リスクです。月次リバランスで配分の偏りを小さく保つことが重要です。";
    }
    return "リスク状態は安定しています。現在の積立方針を維持しつつ定期点検を続けましょう。";
  }, [riskSnapshot]);

  useEffect(() => {
    syncPresetFromStorage();
    const onPresetChanged = () => syncPresetFromStorage();
    window.addEventListener(PRESET_CHANGED_EVENT, onPresetChanged);
    return () =>
      window.removeEventListener(PRESET_CHANGED_EVENT, onPresetChanged);
  }, []);

  useEffect(() => {
    setChartVisible(false);
    const timer = setTimeout(() => {
      setChartVisible(true);
    }, 120);
    return () => clearTimeout(timer);
  }, [summary?.portfolio.id, summary?.transactionCount]);

  useEffect(() => {
    setHistoryChartVisible(false);
    const timer = setTimeout(() => {
      setHistoryChartVisible(true);
    }, 120);
    return () => clearTimeout(timer);
  }, [historyRange, summary?.portfolio.id]);

  const presetInfoText =
    "投資性向プリセットとは?\n積極成長型・均衡型・安定型のいずれかを選び、目標比率の参考としてアプリ内に記録します。実際の目標比率はポートフォリオページで編集できます。\n「選択・修正」からいつでも変更できます。";

  return (
    <section
      ref={ref}
      className={`glass-card p-4 reveal-section ${visible ? "is-visible" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title text-lg font-semibold">
          ポートフォリオ要約
        </h2>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="apple-btn group inline-flex min-w-[150px] cursor-pointer items-center justify-center gap-2 px-4 py-2"
        >
          {refreshing ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <RefreshRoundedIcon
              sx={{ fontSize: 24 }}
              className="group-hover:animate-spin"
            />
          )}
          <span>現在価格更新</span>
        </button>
      </div>
      {loading && !summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Paper
              variant="outlined"
              className="min-h-[150px] p-4"
              sx={hoverCardSx}
            >
              <Skeleton variant="text" width={140} height={24} />
              <Skeleton variant="text" width="70%" height={30} />
              <Skeleton variant="text" width="55%" height={24} />
              <Skeleton variant="rounded" width={120} height={24} />
            </Paper>
            <Paper
              variant="outlined"
              className="min-h-[150px] p-4"
              sx={hoverCardSx}
            >
              <Skeleton variant="text" width={180} height={24} />
              <Skeleton variant="text" width="90%" height={22} />
              <Skeleton variant="rounded" width="100%" height={34} />
            </Paper>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Paper
                key={`kpi-skeleton-${idx}`}
                variant="outlined"
                className="min-h-[150px] p-4"
                sx={hoverCardSx}
              >
                <Skeleton variant="text" width={100} height={22} />
                <Skeleton variant="text" width={140} height={42} />
              </Paper>
            ))}
          </div>

          <Paper variant="outlined" className="p-4" sx={hoverCardSx}>
            <Skeleton variant="text" width={140} height={24} />
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton
                  key={`risk-skeleton-${idx}`}
                  variant="rounded"
                  width="100%"
                  height={120}
                />
              ))}
            </div>
          </Paper>

          <Paper variant="outlined" className="p-3" sx={hoverCardSx}>
            <Skeleton variant="text" width={120} height={24} />
            <Skeleton variant="text" width="92%" height={26} />
          </Paper>

          <Paper variant="outlined" className="p-3" sx={hoverCardSx}>
            <Skeleton variant="text" width={130} height={24} />
            <Skeleton variant="rounded" width="100%" height={260} />
          </Paper>

          <Paper variant="outlined" className="p-3" sx={hoverCardSx}>
            <Skeleton variant="text" width={130} height={24} />
            <Skeleton variant="rounded" width="100%" height={280} />
          </Paper>

          <Paper variant="outlined" className="p-3" sx={hoverCardSx}>
            <Skeleton variant="text" width={120} height={24} />
            <Skeleton variant="rounded" width="100%" height={240} />
          </Paper>
        </div>
      ) : summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Paper
              variant="outlined"
              className="min-h-[150px] p-4"
              sx={hoverCardSx}
            >
              <p className="section-subtitle text-sm font-semibold">
                ポートフォリオ
              </p>
              <p className="mt-1 text-base font-semibold">
                {summary.portfolio.name}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {summary.portfolio.userEmail}
              </p>
              <div className="mt-3">
                <Chip
                  size="small"
                  label={`基準通貨 ${summary.portfolio.baseCurrency}`}
                />
              </div>
            </Paper>

            <Paper
              variant="outlined"
              className="min-h-[150px] p-4 flex flex-col"
              sx={hoverCardSx}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="section-subtitle text-sm font-semibold">
                  投資性向プリセット
                </p>
                {renderInfoButton(presetInfoText)}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                現在の記録状態を確認し、目標比率の編集画面へ移動できます。
              </p>
              <Link
                href="/portfolio"
                className="apple-btn mt-auto inline-flex w-full cursor-pointer justify-center px-3 py-1.5 text-xs"
              >
                {`${presetLabel ?? "未設定"}`}
              </Link>
            </Paper>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Paper
              variant="outlined"
              className="min-h-[150px] p-4 flex flex-col"
              sx={hoverCardSx}
            >
              <div className="flex items-center justify-between">
                <p className="section-subtitle text-sm font-semibold">
                  総評価額
                </p>
                {renderInfoButton(
                  "総評価額とは?\n現在保有している全資産の価値を合計したものです。このアプリでは保有数量に現在価格（Mock）を掛けて算出しています。実運用では証券会社APIや市場終値を参照し、より厳密な評価が行われます。したがって、ここでの数値は学習目的の近似値であり、実市場価格とは一致しない場合があります。",
                )}
              </div>
              <p className="mt-auto pt-2 text-2xl font-bold">
                {Number(summary.totalValue).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  {summary.portfolio.baseCurrency}
                </span>
              </p>
            </Paper>

            <Paper
              variant="outlined"
              className="min-h-[150px] p-4 flex flex-col"
              sx={hoverCardSx}
            >
              <p className="section-subtitle text-sm font-semibold">取引件数</p>
              <p className="mt-auto pt-2 text-2xl font-bold">
                {summary.transactionCount}
              </p>
            </Paper>

            <Paper
              variant="outlined"
              className="min-h-[150px] p-4 flex flex-col"
              sx={hoverCardSx}
            >
              <div className="flex items-center justify-between">
                <p className="section-subtitle text-sm font-semibold leading-tight">
                  <span className="block whitespace-nowrap">CAGR</span>
                  <span className="block whitespace-nowrap">
                    (年平均成長率)
                  </span>
                </p>
                {renderInfoButton(
                  "CAGRとは?\n投資期間全体の成長を年率に置き換えて表す指標です。現在の実装では、総買付額と現在評価額をもとにした簡易計算を採用しています。実務では入出金、配当、税金、手数料、時系列価格を含めて算出するため、より精緻な値になります。取引期間が短い場合は過度な歪みを避けるため、累積収益率に近い形で補正しています。\n※ 公式: CAGR = (最終評価額 / 初期投資額)^(1 / 年数) - 1",
                )}
              </div>
              <p className="mt-auto pt-2 text-2xl font-bold text-green-600">
                {summary.cagr === null
                  ? "-"
                  : `${Number((summary.cagr * 100).toFixed(2)).toLocaleString(
                      "en-US",
                      { maximumFractionDigits: 2 },
                    )}%`}
              </p>
            </Paper>

            <Paper
              variant="outlined"
              className="min-h-[150px] p-4 flex flex-col"
              sx={hoverCardSx}
            >
              <div className="flex items-center justify-between">
                <p className="section-subtitle text-sm font-semibold leading-tight">
                  <span className="block whitespace-nowrap">MDD</span>
                  <span className="block whitespace-nowrap">
                    (最大ドローダウン)
                  </span>
                </p>
                {renderInfoButton(
                  "MDD(最大ドローダウン)とは?\n資産価値が過去の高値からどれだけ下落したかを示す最大下落率です。値がよりマイナスであるほど、途中で経験した下落リスクが大きかったことを意味します。現在は取引イベント順に作成した簡易エクイティカーブで近似しています。実務では日次の時価データを使って計算し、より現実に近いリスク評価を行います。\n※ 公式: MDD = (谷の評価額 - 直前ピーク評価額) / 直前ピーク評価額",
                )}
              </div>
              <p className="mt-auto pt-2 text-2xl font-bold text-red-600">
                {`${Number((summary.mdd * 100).toFixed(2)).toLocaleString(
                  "en-US",
                  { maximumFractionDigits: 2 },
                )}%`}
              </p>
            </Paper>
          </div>

          <Paper variant="outlined" className="p-4" sx={hoverCardSx}>
            <div className="flex items-center justify-between">
              <p className="section-subtitle text-sm font-semibold">
                Risk Snapshot
              </p>
              {renderInfoButton(
                "MDD・Volatility・Sharpeの簡易判定に基づく現在のリスク状態です。詳細分析はリスク分析ページで確認できます。",
              )}
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              {[
                {
                  label: "MDD (最大ドローダウン)",
                  value: `${Number(
                    riskSnapshot.mddPct.toFixed(2),
                  ).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`,
                  level: riskSnapshot.mddLevel,
                  info: "MDD(最大ドローダウン)は、過去ピークからの最大下落率です。値が低いほど下落リスクが高い状態を示します。",
                },
                {
                  label: "Volatility (年率変動性)",
                  value: `${Number(
                    riskSnapshot.volatilityPct.toFixed(2),
                  ).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`,
                  level: riskSnapshot.volatilityLevel,
                  info: "Volatilityは価格変動の大きさを示します。高いほど値動きが大きく、短期損益の振れ幅が広い状態です。",
                },
                {
                  label: "Sharpe (効率指標)",
                  value: Number(riskSnapshot.sharpe.toFixed(2)).toLocaleString(
                    "en-US",
                    { maximumFractionDigits: 2 },
                  ),
                  level: riskSnapshot.sharpeLevel,
                  info: "Sharpeはリスク当たりのリターン効率を示します。高いほど効率的な運用状態です。",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-slate-200/80 bg-white/80 px-2.5 py-2 flex min-h-[120px] flex-col"
                >
                  <div className="inline-flex items-center gap-1">
                    <p className="text-[11px] font-semibold text-slate-600">
                      {item.label}
                    </p>
                    {renderInfoButton(item.info)}
                  </div>
                  <p className="mt-auto pt-2 text-base font-bold text-slate-800">
                    {item.value}
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      item.level === "HIGH"
                        ? "bg-rose-100 text-rose-700"
                        : item.level === "MEDIUM"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {`危険度 ${item.level}`}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/risk-analysis"
              className="apple-btn mt-3 inline-flex w-full cursor-pointer justify-center px-3 py-1.5 text-xs"
            >
              リスク分析へ
            </Link>
          </Paper>

          <Paper variant="outlined" className="p-3" sx={hoverCardSx}>
            <div className="flex items-center justify-between gap-2">
              <p className="section-subtitle text-sm font-semibold">
                AI Insight
              </p>
              <Link
                href="/risk-analysis"
                className="text-xs font-semibold text-blue-700 underline-offset-2 hover:underline"
              >
                詳細へ
              </Link>
            </div>
            <p className="mt-2 text-sm text-slate-700">{aiInsightOneLiner}</p>
          </Paper>

          <Paper variant="outlined" className="p-3" sx={hoverCardSx}>
            <div className="mb-2 inline-flex items-center gap-1">
              <h3 className="section-subtitle text-sm font-semibold">
                資産比率チャート
              </h3>
              {renderInfoButton(
                "資産比率チャートとは?\n保有中の各資産がポートフォリオ全体に占める割合を可視化したものです。構成の偏りや分散状況を直感的に確認できます。\n現在は各資産の評価額を合計評価額で割る簡易計算で表示しています。実務では時価、為替、手数料、未約定要素などを加味して算出する場合があります。\n※ 公式: 比率(%) = 各資産評価額 / 総評価額 × 100",
              )}
            </div>
            <div
              className={`transition-all duration-[1200ms] ${
                chartVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <PieChart
                height={260}
                slotProps={{
                  tooltip: {
                    trigger: "item",
                    anchor: "pointer",
                  },
                }}
                series={[
                  {
                    innerRadius: 55,
                    outerRadius: 100,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    data: chartPositions.map((position, idx) => ({
                      ...position,
                      color:
                        position.id === "others"
                          ? "#94A3B8"
                          : palette[idx % palette.length],
                    })),
                  },
                ]}
              />
            </div>
          </Paper>

          <Paper variant="outlined" className="p-3" sx={hoverCardSx}>
            <div className="mb-2 inline-flex items-center gap-1">
              <h3 className="section-subtitle text-sm font-semibold">
                資産推移グラフ
              </h3>
              {renderInfoButton(
                "資産推移グラフとは?\n取引時点ごとにポートフォリオ評価額がどう変化したかを時系列で示すグラフです。上昇・下落の流れと変動の大きさを確認できます。\n現在は取引履歴ベースの簡易エクイティカーブで、価格はMockの現在価格を用いて近似しています。実務では日次終値ベースでより連続的に算出するのが一般的です。\n※ 公式: 評価額(t) = Σ[保有数量_i(t) × 価格_i(t)]",
              )}
            </div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {(["1M", "3M", "1Y", "ALL"] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setHistoryRange(range)}
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm transition-all duration-250 ${
                      historyRange === range
                        ? "border-blue-400/60 bg-gradient-to-b from-blue-200/75 to-blue-300/55 text-blue-900 shadow-[0_6px_16px_rgba(37,99,235,0.2)]"
                        : "border-blue-200/70 bg-blue-50/60 text-blue-700 hover:bg-blue-100/75"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              {historyStats && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Chip
                    size="small"
                    label={`開始 ${Number(historyStats.start.toFixed(0)).toLocaleString("en-US")} ${summary.portfolio.baseCurrency}`}
                  />
                  <Chip
                    size="small"
                    label={`最低 ${Number(historyStats.min.toFixed(0)).toLocaleString("en-US")} ${summary.portfolio.baseCurrency}`}
                  />
                  <Chip
                    size="small"
                    label={`最高 ${Number(historyStats.max.toFixed(0)).toLocaleString("en-US")} ${summary.portfolio.baseCurrency}`}
                  />
                </div>
              )}
            </div>
            <div
              className={`transition-all duration-300 ${
                historyChartVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {historyValues.length > 0 ? (
                <NoSsr
                  fallback={
                    <div className="h-[280px] w-full animate-pulse rounded bg-slate-100/80" />
                  }
                >
                  <LineChart
                    key={`dashboard-history-${summary.portfolio.id}-${historyValues.length}-${historyRange}`}
                    height={280}
                    margin={{ left: 8, right: 24, top: 20, bottom: 30 }}
                    slotProps={{
                      tooltip: {
                        trigger: "axis",
                        anchor: "pointer",
                      },
                    }}
                    sx={{
                      "& .MuiChartsAxis-line": {
                        stroke: "#60A5FA",
                      },
                      "& .MuiChartsAxis-tick": {
                        stroke: "#60A5FA",
                      },
                      "& .MuiChartsAxis-tickLabel": {
                        fill: "#1E3A8A",
                      },
                      "& .MuiChartsGrid-line": {
                        stroke: "#DBEAFE",
                      },
                    }}
                    xAxis={[
                      {
                        scaleType: "time",
                        tickSpacing: 55,
                        data: historyDates,
                        valueFormatter: (value: Date) =>
                          value.toLocaleDateString("ja-JP", {
                            year: "2-digit",
                            month: "2-digit",
                            day: "2-digit",
                          }),
                      },
                    ]}
                    series={[
                      {
                        data: historyValues,
                        label: `評価額 (${summary.portfolio.baseCurrency})`,
                        color: "green",
                        showMark: false,
                        curve: "monotoneX",
                      },
                    ]}
                    grid={{ horizontal: true }}
                  />
                </NoSsr>
              ) : (
                <p className="text-sm text-gray-500">
                  取引履歴がまだありません
                </p>
              )}
            </div>
          </Paper>

          <Paper
            variant="outlined"
            className="overflow-hidden"
            sx={hoverCardSx}
          >
            <div className="p-3">
              <h3 className="section-subtitle mb-2 text-sm font-semibold">
                保有資産現況
              </h3>
              <TableContainer
                component={Paper}
                variant="outlined"
                className="overflow-x-auto"
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>資産</TableCell>
                      <TableCell align="right">数量 (口)</TableCell>
                      <TableCell align="right">{`金額 (${summary.portfolio.baseCurrency})`}</TableCell>
                      <TableCell>比率</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedPositions.map((position) => (
                      <TableRow
                        key={position.assetId}
                        sx={{
                          ...tableRowHoverSx,
                          "& .MuiTableCell-root": {
                            height: 52,
                            py: 1,
                          },
                        }}
                      >
                        <TableCell>
                          <div className="inline-flex items-center gap-1">
                            <span>{position.ticker}</span>
                            {renderAssetInfoButton(position.ticker)}
                          </div>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip
                            title={formatUpTo4(position.netQuantity)}
                            placement="top"
                          >
                            <span>{formatTruncated(position.netQuantity)}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip
                            title={formatUpTo4(position.totalValue)}
                            placement="top"
                          >
                            <span>{formatTruncated(position.totalValue)}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${getRatioBarColor(
                                  position.weight * 100,
                                )}`}
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, position.weight * 100),
                                  )}%`,
                                }}
                              />
                            </div>
                            <Tooltip
                              title={`${formatUpTo4(position.weight * 100)}%`}
                              placement="top"
                            >
                              <span className="min-w-[64px] text-right text-sm font-semibold text-slate-700">
                                {formatTruncated(position.weight * 100)}%
                              </span>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </Paper>
        </div>
      ) : (
        <div className="space-y-4">
          <Paper variant="outlined" className="p-4" sx={hoverCardSx}>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">投資性向プリセット</p>
                {renderInfoButton(presetInfoText)}
              </div>
              <Link
                href="/portfolio"
                className="apple-btn mt-2 inline-flex w-full cursor-pointer justify-center px-3 py-1.5 text-xs"
              >
                {`${presetLabel ?? "未設定"}`}
              </Link>
            </div>
          </Paper>
          <p className="text-sm text-gray-600">要約データがありません</p>
        </div>
      )}
    </section>
  );
}
