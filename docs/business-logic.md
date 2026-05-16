# Business Logic

[한국어](./business-logic.ko.md)

> 収益・リスク指標（CAGR, MDD, Volatility, Sharpe）と AI Recommendation: [metrics-and-recommendations.md](./metrics-and-recommendations.md)

## Rebalancing（リバランス）

目標比率と現在比率の差から売買金額を算出します。

### Formula

目標金額 = 全体資産 × 目標比率  
差分 = 目標金額 − 現在金額

- 差分 > 0 → **BUY**
- 差分 < 0 → **SELL**
