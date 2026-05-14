"use client";

import type { FormEventHandler } from "react";
import type { AllocationItem, AssetListItem } from "../../types";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { EtfInfoIcon } from "../../components/EtfInfoIcon";
import {
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";

type Props = {
  assets: AssetListItem[];
  allocationAssetId: string;
  allocationRatio: string;
  allocations: AllocationItem[];
  loading: boolean;
  onChangeAllocationAssetId(value: string): void;
  onChangeAllocationRatio(value: string): void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onDelete(id: string): void;
};

export function AllocationSection({
  assets,
  allocationAssetId,
  allocationRatio,
  allocations,
  loading,
  onChangeAllocationAssetId,
  onChangeAllocationRatio,
  onSubmit,
  onDelete,
}: Props) {
  const { ref, visible } = useScrollReveal();

  const formatPercent = (ratio: string) =>
    Number((Number(ratio) * 100).toFixed(2)).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  const ratioToPercent = (ratio: string) => Number(ratio) * 100;
  const getRatioBarColor = (percent: number) => {
    if (percent >= 30) return "bg-blue-600";
    if (percent >= 15) return "bg-blue-500";
    if (percent >= 5) return "bg-sky-500";
    return "bg-slate-400";
  };
  const totalRatioPercent = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.targetRatio) * 100,
    0,
  );
  const totalRatioLabel = Number(totalRatioPercent.toFixed(2)).toLocaleString(
    "en-US",
    { maximumFractionDigits: 2 },
  );
  const progressPercent = Math.max(0, Math.min(100, totalRatioPercent));
  const progressBarColor =
    totalRatioPercent > 100
      ? "bg-red-500"
      : totalRatioPercent === 100
        ? "bg-emerald-500"
        : "bg-blue-500";
  const totalStatusColor =
    totalRatioPercent > 100
      ? "text-red-600"
      : totalRatioPercent === 100
        ? "text-emerald-600"
        : "text-blue-600";

  return (
    <section
      ref={ref}
      className={`glass-card p-4 reveal-section ${visible ? "is-visible" : ""}`}
    >
      <div className="mb-3">
        <h2 className="section-title text-lg font-semibold">目標比率</h2>
      </div>

      <form
        id="allocation-form"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
        onSubmit={onSubmit}
      >
        <label className="flex flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium">資産</span>
          <select
            className="apple-input apple-select h-[42px] p-2"
            value={allocationAssetId}
            onChange={(e) => onChangeAllocationAssetId(e.target.value)}
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.ticker} ({asset.currency})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium">目標比率 (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            className="apple-input h-[42px] p-2"
            value={allocationRatio}
            onChange={(e) => onChangeAllocationRatio(e.target.value)}
            placeholder="例: 70"
          />
        </label>

        <div className="flex flex-col text-sm md:text-xs">
          <span className="mb-1 select-none text-transparent font-medium">
            action
          </span>
          <button
            type="submit"
            disabled={loading}
            className="apple-btn h-[42px] w-full cursor-pointer px-4 py-2"
          >
            {loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "目標比率 追加/更新"
            )}
          </button>
        </div>
      </form>

      <div className="mb-4 mt-4 rounded-xl border border-slate-200/70 bg-white/60 p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-600">合計比率</span>
          <span className={`font-semibold ${totalStatusColor}`}>
            {totalRatioLabel}% / 100%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <TableContainer component={Paper} variant="outlined" className="mt-4">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>資産</TableCell>
              <TableCell>目標比率</TableCell>
              <TableCell align="right">削除</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...allocations]
              .sort(
                (a, b) => Number(b.targetRatio) - Number(a.targetRatio),
              )
              .map((allocation) => (
              <TableRow
                key={allocation.id}
                sx={{
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
                }}
              >
                <TableCell>
                  <div className="inline-flex items-center gap-1">
                    <span>{allocation.assetTicker}</span>
                    <EtfInfoIcon ticker={allocation.assetTicker} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getRatioBarColor(
                          ratioToPercent(allocation.targetRatio),
                        )}`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, ratioToPercent(allocation.targetRatio)),
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="min-w-[64px] text-right text-xs font-semibold text-slate-700">
                      {formatPercent(allocation.targetRatio)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="削除" placement="top">
                    <span>
                      <IconButton
                        size="small"
                        disabled={loading}
                        onClick={() => onDelete(allocation.id)}
                        sx={{
                          color: "grey.500",
                          "&:hover": {
                            color: "error.main",
                            backgroundColor: "rgba(244,67,54,0.08)",
                          },
                        }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  );
}

