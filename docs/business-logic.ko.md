# Business Logic

[日本語](./business-logic.md)

> 수익·리스크 지표(CAGR, MDD, Volatility, Sharpe) 및 AI Recommendation: [metrics-and-recommendations.ko.md](./metrics-and-recommendations.ko.md)

## Rebalancing

목표 비율과 현재 비율의 차이를 계산하여 매수/매도 금액 산출

### Formula

목표 금액 = 전체 자산 × 목표 비율  
차이 = 목표 금액 − 현재 금액

- 차이 > 0 → **BUY**
- 차이 < 0 → **SELL**
