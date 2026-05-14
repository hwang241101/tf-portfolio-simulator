export type RiskPresetId = "aggressive" | "balanced" | "defensive";

export type RiskPreset = {
  id: RiskPresetId;
  label: string;
  description: string;
  allocations: Array<{ ticker: string; ratio: number }>;
  suitableFor: string[];
  metrics: {
    expectedReturn: string;
    expectedMdd: string;
    recommendedHorizon: string;
    riskLevel: string;
    backtest10yAvgAnnualReturn: string;
  };
};

export const PRESET_STORAGE_KEY = "etf-selected-preset";
export const PRESET_CUSTOMIZED_KEY = "etf-selected-preset-customized";

/** プリセット保存後にダッシュボードの表示を即時更新するために発火 */
export const PRESET_CHANGED_EVENT = "etf-preset-changed";

export const RISK_PRESETS: RiskPreset[] = [
  {
    id: "aggressive",
    label: "積極成長型",
    description:
      "株式比率を高めに設定し、長期的な資産拡大を重視する運用プロファイルです。",
    allocations: [
      { ticker: "VOO", ratio: 40 },
      { ticker: "QQQ", ratio: 25 },
      { ticker: "VT", ratio: 20 },
      { ticker: "BND", ratio: 10 },
      { ticker: "IAU", ratio: 5 },
    ],
    suitableFor: [
      "長期積立をしたい",
      "価格変動を受け入れて高い成長を狙いたい",
      "投資経験があり株式比率を高めたい",
    ],
    metrics: {
      expectedReturn: "11%",
      expectedMdd: "-35%",
      recommendedHorizon: "10年+",
      riskLevel: "高",
      backtest10yAvgAnnualReturn: "9.4%",
    },
  },
  {
    id: "balanced",
    label: "均衡型",
    description:
      "株式と債券をバランスよく配分し、リスクとリターンの中庸を狙う運用プロファイルです。",
    allocations: [
      { ticker: "VOO", ratio: 30 },
      { ticker: "VT", ratio: 25 },
      { ticker: "BND", ratio: 25 },
      { ticker: "AGG", ratio: 10 },
      { ticker: "IAU", ratio: 10 },
    ],
    suitableFor: [
      "長期積立をしたい",
      "株式と債券のバランスを重視したい",
      "中程度の価格変動で運用したい",
    ],
    metrics: {
      expectedReturn: "7%",
      expectedMdd: "-22%",
      recommendedHorizon: "5年+",
      riskLevel: "中",
      backtest10yAvgAnnualReturn: "7.2%",
    },
  },
  {
    id: "defensive",
    label: "安定型",
    description:
      "債券や低変動資産を厚くし、資産の安定性と下振れ耐性を重視する運用プロファイルです。",
    allocations: [
      { ticker: "BND", ratio: 35 },
      { ticker: "AGG", ratio: 30 },
      { ticker: "VT", ratio: 15 },
      { ticker: "VOO", ratio: 10 },
      { ticker: "IAU", ratio: 10 },
    ],
    suitableFor: [
      "長期積立をしたい",
      "価格変動を抑えたい",
      "初心者投資家",
    ],
    metrics: {
      expectedReturn: "4%",
      expectedMdd: "-12%",
      recommendedHorizon: "3年+",
      riskLevel: "低",
      backtest10yAvgAnnualReturn: "4.1%",
    },
  },
];
