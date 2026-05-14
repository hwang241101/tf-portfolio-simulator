"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchPortfolios } from "../lib/api";
import { PORTFOLIO_CHANGED_EVENT, PORTFOLIO_STORAGE_KEY } from "../lib/portfolio";
import type { PortfolioListItem } from "../types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/portfolio", label: "ポートフォリオ" },
  { href: "/rebalancing", label: "リバランシング" },
  { href: "/risk-analysis", label: "リスク分析" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");

  useEffect(() => {
    const loadPortfolios = async () => {
      const items = await fetchPortfolios();
      setPortfolios(items);
      const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (saved && items.some((item) => item.id === saved)) {
        setSelectedPortfolioId(saved);
      } else if (items[0]) {
        setSelectedPortfolioId(items[0].id);
        localStorage.setItem(PORTFOLIO_STORAGE_KEY, items[0].id);
      }
    };
    void loadPortfolios();
  }, []);

  const onChangePortfolio = (nextId: string) => {
    setSelectedPortfolioId(nextId);
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, nextId);
    window.dispatchEvent(new Event(PORTFOLIO_CHANGED_EVENT));
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col gap-4 border-r border-slate-200/70 bg-white/75 p-4 backdrop-blur-md">
      <Link
        href="/dashboard"
        className="section-title w-full text-center text-lg font-bold"
      >
        ETF Portfolio Simulator
      </Link>
      <div className="glass-card p-3">
        <p className="mb-2 text-xs font-semibold text-slate-500">Portfolio</p>
        <select
          className="apple-input apple-select w-full p-2 text-sm"
          value={selectedPortfolioId}
          onChange={(e) => onChangePortfolio(e.target.value)}
        >
          {portfolios.map((portfolio) => (
            <option key={portfolio.id} value={portfolio.id}>
              #{portfolio.id} {portfolio.name}
            </option>
          ))}
        </select>
      </div>
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`header-nav-link ${active ? "header-nav-link--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-1 py-1 text-center text-xs text-slate-500">
        Desktop optimized layout
      </div>
    </aside>
  );
}
