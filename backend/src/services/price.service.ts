const MOCK_PRICES_BY_TICKER: Record<string, number> = {
  VOO: 542.3,
  VT: 119.8,
  BND: 72.4,
  SPY: 611.2,
  QQQ: 526.6,
  VTI: 287.4,
  IVV: 613.7,
  SCHB: 67.1,
  SPLG: 72.5,
  IWB: 326.2,
  IEFA: 82.4,
  VEA: 51.8,
  ACWI: 121.5,
  VWO: 46.2,
  IEMG: 54.7,
  SPEM: 41.3,
  VNQ: 86.4,
  SCHH: 20.4,
  XLU: 76.2,
  XLF: 47.9,
  XLK: 228.3,
  XLP: 80.6,
  XLV: 148.5,
  XLE: 94.1,
  AGG: 98.2,
  TLT: 90.7,
  VGIT: 59.4,
  SPTL: 27.7,
  LQD: 108.9,
  BIL: 91.7,
  SGOV: 100.5,
  VIG: 201.3,
  SCHD: 78.6,
  DGRO: 61.9,
  IAU: 62.2,
};

export function getMockCurrentPriceByTicker(
  ticker: string,
  fallback = 100,
): number {
  const base = MOCK_PRICES_BY_TICKER[ticker] ?? fallback;
  const randomFactor = 1 + (Math.random() * 0.1 - 0.05); // -5% ~ +5%
  return Number((base * randomFactor).toFixed(4));
}

