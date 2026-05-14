"use client";

import type { Transaction } from "../../types";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

type Props = {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  currency: string;
  assetTickers: string[];
  loading: boolean;
  onDelete(id: string): void;
  onPageChange(page: number): void;
};

export function TransactionList({
  transactions,
  totalCount,
  page,
  pageSize,
  currency,
  assetTickers,
  loading,
  onDelete,
  onPageChange,
}: Props) {
  const { ref, visible } = useScrollReveal();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [tickerFilter, setTickerFilter] = useState<string>("ALL");

  const formatUpTo4 = (value: number) =>
    Number(value.toFixed(4)).toLocaleString("en-US", {
      maximumFractionDigits: 4,
    });
  const formatTruncated = (value: number) =>
    Math.trunc(value).toLocaleString("en-US");

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId);
    }
    closeConfirm();
  };

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        const typeMatched = typeFilter === "ALL" || tx.type === typeFilter;
        const tickerMatched =
          tickerFilter === "ALL" || tx.assetTicker === tickerFilter;
        return typeMatched && tickerMatched;
      }),
    [transactions, typeFilter, tickerFilter],
  );

  useEffect(() => {
    if (page !== 1) {
      onPageChange(1);
    }
  }, [typeFilter, tickerFilter, page, onPageChange]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "assetTicker", headerName: "資産", width: 110, flex: 1 },
    {
      field: "type",
      headerName: "取引種別",
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={String(params.row.type)}
          color={params.row.type === "BUY" ? "success" : "error"}
          variant="outlined"
        />
      ),
    },
    {
      field: "quantity",
      headerName: "数量 (口)",
      width: 140,
      renderCell: (params) => {
        const value = Number(params.row.quantity);
        return (
          <Tooltip title={formatUpTo4(value)} placement="top">
            <span>{formatTruncated(value)}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "price",
      headerName: `価格 (${currency})`,
      width: 140,
      renderCell: (params) => {
        const value = Number(params.row.price);
        return (
          <Tooltip title={formatUpTo4(value)} placement="top">
            <span>{formatTruncated(value)}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "action",
      headerName: "削除",
      width: 88,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="削除" placement="top">
          <span>
            <IconButton
              size="small"
              disabled={loading}
              onClick={() => requestDelete(String(params.row.id))}
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
      ),
    },
  ];

  return (
    <section
      ref={ref}
      className={`glass-card p-4 reveal-section ${visible ? "is-visible" : ""}`}
    >
      <h2 className="section-title mb-3 text-lg font-semibold">取引履歴</h2>
      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <label className="flex flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium text-slate-600">取引種別フィルター</span>
          <select
            className="apple-input apple-select h-[38px] px-2"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as "ALL" | "BUY" | "SELL")
            }
          >
            <option value="ALL">全て</option>
            <option value="BUY">BUY のみ</option>
            <option value="SELL">SELL のみ</option>
          </select>
        </label>
        <label className="flex flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium text-slate-600">ETF フィルター</span>
          <select
            className="apple-input apple-select h-[38px] px-2"
            value={tickerFilter}
            onChange={(event) => setTickerFilter(event.target.value)}
          >
            <option value="ALL">全て</option>
            {assetTickers.map((ticker) => (
              <option key={ticker} value={ticker}>
                {ticker}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium text-slate-600">初期化</span>
          <button
            type="button"
            className="apple-btn h-[38px] px-3 py-1 text-sm"
            onClick={() => {
              setTypeFilter("ALL");
              setTickerFilter("ALL");
            }}
          >
            フィルター解除
          </button>
        </div>
      </div>
      <DataGrid
        rows={filteredTransactions}
        columns={columns}
        rowCount={totalCount}
        loading={loading}
        pageSizeOptions={[10]}
        paginationModel={{ page: Math.max(0, page - 1), pageSize }}
        paginationMode="server"
        onPaginationModelChange={(model) => onPageChange(model.page + 1)}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          "& .MuiDataGrid-cell": {
            alignItems: "center",
          },
          "& .MuiDataGrid-row": {
            transition:
              "background-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(33, 150, 243, 0.08)",
            outline: "1px solid rgba(33, 150, 243, 0.6)",
            outlineOffset: "-1px",
            boxShadow: "0 0 10px rgba(33, 150, 243, 0.22)",
            transform: "translateY(-1px)",
          },
          "& .MuiDataGrid-row:hover .MuiDataGrid-cell": {
            color: "#0f2749",
            fontWeight: 600,
          },
        }}
      />
      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
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
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>削除の確認</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 16 }}>
            本当にこの取引履歴を削除しますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeConfirm} variant="outlined" size="large">
            いいえ
          </Button>
          <Button
            onClick={confirmDelete}
            color="primary"
            variant="contained"
            size="large"
          >
            はい
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}

