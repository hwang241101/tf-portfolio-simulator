# Business Logic

> 수익·리스크 지표(CAGR, MDD, Volatility, Sharpe) 및 AI Recommendation: [metrics-and-recommendations.md](./metrics-and-recommendations.md)

## Rebalancing

목표 비율과 현재 비율의 차이를 계산하여 매수/매도 금액 산출

### Formula

목표 금액 = 전체 자산 × 목표 비율  
차이 = 목표 금액 - 현재 금액

- - → BUY
- - → SELL
