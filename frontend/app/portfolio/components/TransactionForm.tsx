"use client";

import type { FormEventHandler } from "react";
import type { AssetListItem } from "../../types";
import { CircularProgress } from "@mui/material";
import { useScrollReveal } from "../../hooks/useScrollReveal";

type Props = {
  assetId: string;
  type: string;
  quantity: string;
  price: string;
  loading: boolean;
  assets: AssetListItem[];
  onChangeAssetId(value: string): void;
  onChangeType(value: string): void;
  onChangeQuantity(value: string): void;
  onChangePrice(value: string): void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  canSubmit: boolean;
};

export function TransactionForm({
  assetId,
  type,
  quantity,
  price,
  loading,
  assets,
  onChangeAssetId,
  onChangeType,
  onChangeQuantity,
  onChangePrice,
  onSubmit,
  canSubmit,
}: Props) {
  const { ref, visible } = useScrollReveal();

  return (
    <section
      ref={ref}
      className={`glass-card p-4 reveal-section ${visible ? "is-visible" : ""}`}
    >
      <h2 className="section-title mb-3 text-lg font-semibold">取引登録</h2>
      <form
        className="grid grid-cols-1 gap-3 md:grid-cols-4"
        onSubmit={onSubmit}
      >
        <label className="flex w-full flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium">資産 (ETF)</span>
          <select
            className="apple-input apple-select w-full p-2"
            value={assetId}
            onChange={(e) => onChangeAssetId(e.target.value)}
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.ticker} ({asset.currency})
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium">取引種別</span>
          <select
            className="apple-input apple-select w-full p-2"
            value={type}
            onChange={(e) => onChangeType(e.target.value)}
          >
            <option value="BUY">買い (BUY)</option>
            <option value="SELL">売り (SELL)</option>
          </select>
        </label>
        <label className="flex w-full flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium">数量</span>
          <input
            type="number"
            min="0"
            step="1"
            className="apple-input w-full p-2"
            value={quantity}
            onChange={(e) => onChangeQuantity(e.target.value)}
            placeholder="例: 10"
          />
        </label>
        <label className="flex w-full flex-col text-sm md:text-xs">
          <span className="mb-1 font-medium">価格</span>
          <input
            type="number"
            min="0"
            step="1"
            className="apple-input w-full p-2"
            value={price}
            onChange={(e) => onChangePrice(e.target.value)}
            placeholder="例: 100"
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="apple-btn cursor-pointer px-4 py-2 md:col-span-4"
        >
          {loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            "取引登録"
          )}
        </button>
      </form>
    </section>
  );
}

