"use client";

import type { RebalanceItem } from "../../types";
import {
  Chip,
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { EtfInfoIcon } from "../../components/EtfInfoIcon";

type Props = {
  items: RebalanceItem[];
  currency: string;
  loading: boolean;
  onApply(): void;
};

export function RebalanceSection({ items, currency, loading, onApply }: Props) {
  const { ref, visible } = useScrollReveal();
  const formatQty = (value: number) =>
    Number(value.toFixed(4)).toLocaleString("en-US", {
      maximumFractionDigits: 4,
    });
  const formatAmt = (value: number) =>
    Number(value.toFixed(4)).toLocaleString("en-US", {
      maximumFractionDigits: 4,
    });
  const formatPct = (value: number) =>
    Number(value.toFixed(4)).toLocaleString("en-US", {
      maximumFractionDigits: 4,
    });
  const formatTruncated = (value: number) =>
    Math.trunc(value).toLocaleString("en-US");

  return (
    <section
      ref={ref}
      className={`glass-card p-4 reveal-section ${visible ? "is-visible" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title text-lg font-semibold">リバランス</h2>
          <p className="text-xs text-gray-500">
            現在の目標比率に合わせて取引を実行します
          </p>
        </div>
        <Tooltip
          placement="top"
          title={
            <span style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>
              リバランスとは？
              {"\n"}
              目標比率に合わせて売買を自動作成します。実行すると取引履歴に反映されます。適用前に対象数量と金額を確認してください。
            </span>
          }
        >
          <IconButton size="small" sx={{ color: "grey.500" }}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <div className="rounded">
        {items.length === 0 ? (
          <p className="text-sm text-gray-600">
            適用対象なし（目標比率と現在の比率が同じです）
          </p>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>資産</TableCell>
                  <TableCell>アクション</TableCell>
                  <TableCell align="right">現在比率 (%)</TableCell>
                  <TableCell align="center">→</TableCell>
                  <TableCell align="right">目標比率 (%)</TableCell>
                  <TableCell align="right">数量 (口)</TableCell>
                  <TableCell align="right">{`金額 (${currency})`}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow
                    key={`${item.assetId}-${item.action}-${idx}`}
                    sx={{
                      backgroundColor:
                        item.action === "BUY"
                          ? "rgba(16, 185, 129, 0.05)"
                          : "rgba(244, 63, 94, 0.05)",
                      transition:
                        "background-color 180ms ease, box-shadow 180ms ease, outline-color 180ms ease, transform 180ms ease",
                      "& .MuiTableCell-root": {
                        height: 52,
                        py: 1,
                      },
                      "&:hover": {
                        backgroundColor:
                          item.action === "BUY"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(244, 63, 94, 0.1)",
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
                        <span>{item.assetTicker}</span>
                        <EtfInfoIcon ticker={item.assetTicker} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.action}
                        color={item.action === "BUY" ? "success" : "error"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={`${formatPct(item.currentRatio)}%`} placement="top">
                        <span>{formatTruncated(item.currentRatio)}%</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-base font-semibold text-slate-500">→</span>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={`${formatPct(item.targetRatio)}%`} placement="top">
                        <span>{formatTruncated(item.targetRatio)}%</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={formatQty(item.quantity)} placement="top">
                        <span>{formatTruncated(item.quantity)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={formatAmt(item.amount)} placement="top">
                        <span>{formatTruncated(item.amount)}</span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <button
        onClick={(event) => {
          event.currentTarget.blur();
          onApply();
        }}
        disabled={loading || items.length === 0}
        className="apple-btn mt-3 inline-flex w-full cursor-pointer items-center justify-center px-4 py-2.5"
      >
        {loading ? <CircularProgress size={18} color="inherit" /> : "リバランス適用"}
      </button>
    </section>
  );
}

