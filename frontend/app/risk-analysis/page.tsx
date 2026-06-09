"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  CircularProgress,
  IconButton,
  NoSsr,
  Paper,
  Tooltip,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { fetchPortfolioSummary } from "../lib/api";
import {
  PORTFOLIO_CHANGED_EVENT,
  PORTFOLIO_STORAGE_KEY,
} from "../lib/portfolio";
import type { PortfolioSummary } from "../types";

type RiskMetrics = {
  mddPct: number;
  sharpe: number;
  volatilityPct: number;
  cagrPct: number | null;
  calmar: number | null;
  sortino: number | null;
};

type RecommendationItem = {
  level: "high" | "medium" | "low";
  indicator: string;
  indicatorInfo: string;
  reason: string;
  recommendation: string;
  expectedEffect: string;
};

function formatSignedPercent(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "-";
  const abs = Number(Math.abs(value).toFixed(digits)).toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
  return `${value >= 0 ? "+" : "-"}${abs}%`;
}

function formatNumber(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "-";
  return Number(value.toFixed(digits)).toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
}
function formatArrowPercent(value: number, digits = 1) {
  return `${Number(value.toFixed(digits)).toLocaleString("en-US", {
    maximumFractionDigits: digits,
  })}%`;
}
function renderHighlightedMetricText(text: string) {
  return text.split(/([+-]?\d+(?:\.\d+)?%?)/g).map((part, idx) => {
    if (!part) return null;
    const isNumberToken = /\d/.test(part);
    if (!isNumberToken) return <span key={`${idx}-${part}`}>{part}</span>;
    return (
      <span
        key={`${idx}-${part}`}
        className="rounded-sm bg-blue-100/90 px-1 py-0.5 font-bold text-blue-700"
      >
        {part}
      </span>
    );
  });
}

export default function RiskAnalysisPage() {
  const [portfolioId, setPortfolioId] = useState("1");
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [growthChartVisible, setGrowthChartVisible] = useState(false);
  const [drawdownChartVisible, setDrawdownChartVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (saved) setPortfolioId(saved);

    const syncPortfolio = () => {
      const next = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (next) setPortfolioId(next);
    };
    window.addEventListener(PORTFOLIO_CHANGED_EVENT, syncPortfolio);
    return () =>
      window.removeEventListener(PORTFOLIO_CHANGED_EVENT, syncPortfolio);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPortfolioSummary(portfolioId);
        setSummary(data);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "リスク分析データの取得に失敗しました",
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [portfolioId]);

  const history = useMemo(
    () =>
      [...(summary?.valueHistory ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [summary?.valueHistory],
  );
  const growthLabels = history.map((item, idx) => {
    const dateLabel = new Date(item.date).toLocaleDateString("ja-JP", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });
    return `${dateLabel}__${idx}`;
  });
  const growthValues = history.map((item) => item.value);

  const drawdownSeries = useMemo(() => {
    let peak = Number.NEGATIVE_INFINITY;
    return growthValues.map((value) => {
      peak = Math.max(peak, value);
      if (peak <= 0) return 0;
      return ((value - peak) / peak) * 100;
    });
  }, [growthValues]);

  const riskMetrics: RiskMetrics = useMemo(() => {
    if (growthValues.length < 2) {
      return {
        mddPct: (summary?.mdd ?? 0) * 100,
        sharpe: 0,
        volatilityPct: 0,
        cagrPct: summary?.cagr !== null && summary ? summary.cagr * 100 : null,
        calmar: null,
        sortino: null,
      };
    }

    const returns: number[] = [];
    for (let i = 1; i < growthValues.length; i += 1) {
      const prev = growthValues[i - 1];
      const cur = growthValues[i];
      if (prev > 0) returns.push(cur / prev - 1);
    }

    if (returns.length === 0) {
      return {
        mddPct: (summary?.mdd ?? 0) * 100,
        sharpe: 0,
        volatilityPct: 0,
        cagrPct: summary?.cagr !== null && summary ? summary.cagr * 100 : null,
        calmar: null,
        sortino: null,
      };
    }

    const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;
    const variance =
      returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length;
    const stdev = Math.sqrt(variance);
    const annualFactor = Math.sqrt(252);
    const volatilityPct = stdev * annualFactor * 100;
    const sharpe = stdev > 0 ? (mean / stdev) * annualFactor : 0;

    const downside = returns.filter((r) => r < 0);
    const downsideVariance =
      downside.length > 0
        ? downside.reduce((acc, r) => acc + r * r, 0) / downside.length
        : 0;
    const downsideDev = Math.sqrt(downsideVariance);
    const sortino =
      downsideDev > 0 ? (mean / downsideDev) * annualFactor : null;

    const cagrPct =
      summary?.cagr !== null && summary ? summary.cagr * 100 : null;
    const mddAbs = Math.abs((summary?.mdd ?? 0) * 100);
    const calmar = cagrPct !== null && mddAbs > 0 ? cagrPct / mddAbs : null;

    return {
      mddPct: (summary?.mdd ?? 0) * 100,
      sharpe,
      volatilityPct,
      cagrPct,
      calmar,
      sortino,
    };
  }, [growthValues, summary]);

  const aiRecommendations = useMemo(() => {
    if (!summary) return [] as RecommendationItem[];
    const recs: RecommendationItem[] = [];
    const topWeight = summary.positions.reduce(
      (max, p) => Math.max(max, p.weight * 100),
      0,
    );
    if (riskMetrics.mddPct <= -25) {
      const nextMdd = Math.min(-5, riskMetrics.mddPct + 4);
      recs.push({
        level: "high",
        indicator: "MDD",
        indicatorInfo:
          "MDD(最大ドローダウン)は過去ピークからの最大下落率です。よりマイナスが大きいほど、下落リスクが高い状態です。",
        reason: `MDD ${formatSignedPercent(riskMetrics.mddPct)} が基準(-25%)を下回っています。`,
        recommendation:
          "債券ETF比率を5〜10%増やして下落耐性の改善を推奨します。",
        expectedEffect: `MDD が ${formatArrowPercent(riskMetrics.mddPct)} から ${formatArrowPercent(nextMdd)} へ改善する見込みです。`,
      });
    }
    if (riskMetrics.volatilityPct >= 22) {
      const nextVolatility = Math.max(8, riskMetrics.volatilityPct - 4);
      recs.push({
        level: "high",
        indicator: "Volatility",
        indicatorInfo:
          "Volatility(年率変動性)は価格変動の大きさを示します。高いほど値動きが荒く、短期損益の振れ幅が大きい状態です。",
        reason: `年率Volatility ${formatSignedPercent(riskMetrics.volatilityPct)} が基準(22%)を上回っています。`,
        recommendation: "高変動セクターETFを一部減らし、分散強化を推奨します。",
        expectedEffect: `年率Volatility が ${formatArrowPercent(riskMetrics.volatilityPct)} から ${formatArrowPercent(nextVolatility)} へ低下する見込みです。`,
      });
    }
    if (riskMetrics.sharpe < 0.7) {
      const nextSharpe = riskMetrics.sharpe + 0.2;
      recs.push({
        level: "medium",
        indicator: "Sharpe",
        indicatorInfo:
          "Sharpe Ratioはリスク(変動)あたりのリターン効率を示す指標です。低いほど、取っているリスクに対する効率が低い状態です。",
        reason: `Sharpe ${formatNumber(riskMetrics.sharpe)} が基準(0.70)を下回っています。`,
        recommendation:
          "低相関資産を組み合わせ、リスク当たり効率の改善を推奨します。",
        expectedEffect: `Sharpe が ${formatNumber(riskMetrics.sharpe)} から ${formatNumber(nextSharpe)} へ改善する見込みです。`,
      });
    }
    if (topWeight >= 40) {
      const nextTopWeight = 35;
      recs.push({
        level: "medium",
        indicator: "Concentration",
        indicatorInfo:
          "Concentration(集中度)は特定銘柄への偏りを示します。上位比率が高いほど、個別銘柄リスクがポートフォリオ全体に波及しやすくなります。",
        reason: `最大保有比率 ${formatNumber(topWeight)}% が集中閾値(40%)を超えています。`,
        recommendation: "上位銘柄を35%未満に抑えるリバランスを推奨します。",
        expectedEffect: `最大保有比率が ${formatArrowPercent(topWeight)} から ${formatArrowPercent(nextTopWeight)} 付近まで低下する見込みです。`,
      });
    }
    if (recs.length === 0) {
      recs.push({
        level: "low",
        indicator: "Overall",
        indicatorInfo:
          "Overallは主要リスク指標(MDD・Volatility・Sharpe・集中度)を総合して、現在が安定圏かどうかを示す状態ラベルです。",
        reason: "主要リスク指標が警戒閾値内に収まっています。",
        recommendation:
          "定期積立を維持し、月次リバランスで現状継続を推奨します。",
        expectedEffect: `主要リスク指標は現在水準（MDD ${formatArrowPercent(
          riskMetrics.mddPct,
        )}）を維持する見込みです。`,
      });
    }
    return recs.slice(0, 3);
  }, [summary, riskMetrics]);
  useEffect(() => {
    setGrowthChartVisible(false);
    const timer = setTimeout(() => setGrowthChartVisible(true), 120);
    return () => clearTimeout(timer);
  }, [summary?.portfolio.id, summary?.transactionCount]);
  useEffect(() => {
    setDrawdownChartVisible(false);
    const timer = setTimeout(() => setDrawdownChartVisible(true), 120);
    return () => clearTimeout(timer);
  }, [summary?.portfolio.id, summary?.transactionCount]);
  const hoverCardClass =
    "transition-all duration-200 hover:bg-blue-50/60 hover:outline hover:outline-1 hover:outline-blue-400/60 hover:outline-offset-[-1px] hover:shadow-[0_0_10px_rgba(33,150,243,0.22)]";
  const hoverChartCardClass =
    "transition-all duration-200 hover:bg-blue-50/60 hover:outline hover:outline-1 hover:outline-blue-400/60 hover:outline-offset-[-1px] hover:shadow-[0_0_10px_rgba(33,150,243,0.22)]";
  const renderInfoButton = (text: string) => (
    <Tooltip
      placement="top"
      title={
        <span style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{text}</span>
      }
    >
      <IconButton size="small" sx={{ color: "grey.500", p: 0.25 }}>
        <InfoOutlinedIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Tooltip>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-6 p-6">
      <section className="glass-card overflow-hidden">
        <div
          className="h-0.5 w-full bg-gradient-to-r from-blue-300/70 via-sky-400/50 to-indigo-400/60"
          aria-hidden
        />
        <div className="page-hero-body p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Risk Analysis
          </p>
          <h1 className="section-title mt-1 text-2xl font-bold tracking-tight">
            リスク分析
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            KPI・成長曲線・ドローダウンをまとめて確認し、ポートフォリオのリスク状態を把握します。
          </p>
        </div>
      </section>

      {loading ? (
        <section className="glass-card p-8 text-center">
          <CircularProgress size={26} />
          <p className="mt-3 text-sm text-slate-600">
            リスク指標を計算中です...
          </p>
        </section>
      ) : error ? (
        <section className="glass-card p-6">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </section>
      ) : !summary ? (
        <section className="glass-card p-6">
          <p className="text-sm text-slate-600">
            表示できるデータがありません。
          </p>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: "MDD",
                value: formatSignedPercent(riskMetrics.mddPct),
                tone: "text-rose-600",
                info: "MDD(最大ドローダウン)は、過去ピークからの最大下落率です。値が低いほど、下落リスクが大きいことを意味します。",
              },
              {
                label: "Sharpe",
                value: formatNumber(riskMetrics.sharpe),
                tone: "text-slate-800",
                info: "Sharpe Ratioは、リスク(変動)あたりの超過リターン効率を示します。高いほど効率的です。",
              },
              {
                label: "Volatility",
                value: formatSignedPercent(riskMetrics.volatilityPct),
                tone: "text-amber-700",
                info: "Volatility(年率変動性)は、価格変動の大きさを示します。高いほど値動きが大きい状態です。",
              },
              {
                label: "CAGR",
                value: formatSignedPercent(riskMetrics.cagrPct),
                tone: "text-emerald-700",
                info: "CAGR(年平均成長率)は、一定期間の成長を年率で表した指標です。",
              },
              {
                label: "Calmar",
                value: formatNumber(riskMetrics.calmar),
                tone: "text-indigo-700",
                info: "Calmar Ratioは、CAGRを最大ドローダウンで割った指標で、下落リスクに対する成長効率を示します。",
              },
              {
                label: "Sortino",
                value: formatNumber(riskMetrics.sortino),
                tone: "text-sky-700",
                info: "Sortino Ratioは、下方変動のみをリスクとして見たリターン効率指標です。高いほど安定的です。",
              },
            ].map((item) => (
              <Paper
                key={item.label}
                variant="outlined"
                className={`glass-card p-4 ${hoverCardClass}`}
              >
                <div className="inline-flex items-center gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
                    {item.label}
                  </p>
                  {renderInfoButton(item.info)}
                </div>
                <p className={`mt-1 text-xl font-bold ${item.tone}`}>
                  {item.value}
                </p>
              </Paper>
            ))}
          </section>

          <section className="w-full">
            <Paper
              variant="outlined"
              className={`glass-card p-4 ${hoverChartCardClass}`}
            >
              <div className="inline-flex items-center gap-1">
                <h3 className="section-subtitle text-sm font-semibold">
                  資産成長推移
                </h3>
                {renderInfoButton(
                  "資産成長推移とは？\nポートフォリオ総評価額の時系列変化を示します。上昇トレンドと変動の大きさを確認できます。",
                )}
              </div>
              {growthValues.length > 1 ? (
                <div
                  className={`transition-all duration-[1200ms] ${
                    growthChartVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <NoSsr
                    fallback={
                      <div className="h-[280px] w-full animate-pulse rounded bg-slate-100/80" />
                    }
                  >
                    <LineChart
                      key={`growth-${portfolioId}-${growthValues.length}`}
                      height={280}
                      margin={{ left: 8, right: 24, top: 20, bottom: 30 }}
                      slotProps={{
                        tooltip: {
                          trigger: "axis",
                          anchor: "pointer",
                        },
                      }}
                      xAxis={[
                        {
                          scaleType: "point",
                          data: growthLabels,
                          tickSpacing: 55,
                          valueFormatter: (value: string) =>
                            value.split("__")[0] ?? value,
                        },
                      ]}
                      yAxis={[
                        {
                          width: 50,
                        },
                      ]}
                      series={[
                        {
                          data: growthValues,
                          label: `評価額 (${summary.portfolio.baseCurrency})`,
                          curve: "monotoneX",
                          color: "#2563EB",
                          showMark: false,
                        },
                      ]}
                      grid={{ horizontal: true }}
                    />
                  </NoSsr>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  取引履歴データが不足しています。
                </p>
              )}
            </Paper>
          </section>

          <section className="w-full">
            <Paper
              variant="outlined"
              className={`glass-card p-4 ${hoverChartCardClass}`}
            >
              <div className="inline-flex items-center gap-1">
                <h3 className="section-subtitle text-sm font-semibold">
                  ドローダウン推移
                </h3>
                {renderInfoButton(
                  "ドローダウン推移とは？\n過去ピークからの下落率の推移です。値が低いほど、ピークからの下落が大きいことを意味します。",
                )}
              </div>
              {drawdownSeries.length > 1 ? (
                <div
                  className={`transition-all duration-300 ${
                    drawdownChartVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <NoSsr
                    fallback={
                      <div className="h-[280px] w-full animate-pulse rounded bg-slate-100/80" />
                    }
                  >
                    <LineChart
                      key={`drawdown-${portfolioId}-${drawdownSeries.length}`}
                      height={280}
                      margin={{ left: 8, right: 24, top: 20, bottom: 30 }}
                      slotProps={{
                        tooltip: {
                          trigger: "axis",
                          anchor: "pointer",
                        },
                      }}
                      xAxis={[
                        {
                          scaleType: "point",
                          data: growthLabels,
                          tickSpacing: 55,
                          valueFormatter: (value: string) =>
                            value.split("__")[0] ?? value,
                        },
                      ]}
                      yAxis={[{ min: Math.min(...drawdownSeries, -1), max: 0 }]}
                      series={[
                        {
                          data: drawdownSeries,
                          label: "ドローダウン (%)",
                          valueFormatter: (value) =>
                            `${Number(value ?? 0).toFixed(2)}%`,
                          curve: "monotoneX",
                          color: "#DC2626",
                          showMark: false,
                        },
                      ]}
                      grid={{ horizontal: true }}
                    />
                  </NoSsr>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  取引履歴データが不足しています。
                </p>
              )}
            </Paper>
          </section>

          <section>
            <Paper
              variant="outlined"
              className={`glass-card p-5 ${hoverCardClass}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                AI Recommendation
              </p>
              <h3 className="section-subtitle mt-1 text-sm font-semibold">
                リスク調整の提案
                {renderInfoButton(
                  "危険度レベルの目安\nHIGH: 早めのリスク調整が必要な状態\nMEDIUM: 監視しつつ配分調整を検討する状態\nLOW: 現在の運用方針を維持しやすい安定状態",
                )}
              </h3>
              <ul className="mt-3 space-y-2 text-base text-slate-700">
                {aiRecommendations.map((rec, idx) => (
                  <li
                    key={`${idx}-${rec.reason}`}
                    className="rounded-lg border border-blue-200/70 bg-blue-50/65 px-3 py-2.5"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          rec.level === "high"
                            ? "bg-rose-100 text-rose-700"
                            : rec.level === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {`${rec.indicator} 危険度: ${rec.level.toUpperCase()}`}
                      </span>
                      {renderInfoButton(rec.indicatorInfo)}
                    </div>
                    <div className="mt-2 grid grid-cols-1 items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-3">
                      <div className="flex h-full min-h-[108px] flex-col rounded-md border border-slate-200/90 bg-white/85 px-2.5 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          原因
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-800">
                          {renderHighlightedMetricText(rec.reason)}
                        </p>
                      </div>
                      <div className="hidden items-center justify-center self-stretch md:flex">
                        <ArrowForwardRoundedIcon
                          sx={{ fontSize: 24, color: "rgb(148 163 184)" }}
                        />
                      </div>
                      <div className="flex h-full min-h-[108px] flex-col rounded-md border border-slate-200/90 bg-white/85 px-2.5 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          提案
                        </p>
                        <p className="mt-0.5 text-sm text-slate-800">
                          {renderHighlightedMetricText(rec.recommendation)}
                        </p>
                      </div>
                      <div className="hidden items-center justify-center self-stretch md:flex">
                        <ArrowForwardRoundedIcon
                          sx={{ fontSize: 24, color: "rgb(148 163 184)" }}
                        />
                      </div>
                      <div className="flex h-full min-h-[108px] flex-col rounded-md border border-slate-200/90 bg-white/85 px-2.5 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          結果
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-800">
                          {renderHighlightedMetricText(rec.expectedEffect)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-slate-500">
                ※
                AI提案は学習用のルールベース参考情報であり、投資成果を保証するものではありません。
              </p>
            </Paper>
          </section>
        </>
      )}
    </main>
  );
}
