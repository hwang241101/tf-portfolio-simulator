# 지표 · AI Recommendation

[日本語](./metrics-and-recommendations.md)

대시보드·리스크 분석 화면에서 쓰는 **수익·리스크 지표**와 **AI Recommendation**의 의미, 계산 방식, 한계를 정리합니다.

> **공통 전제:** 평가 가격은 `backend/src/services/price.service.ts`의 **Mock 현재가**입니다. 실시간 시장 시세·환율·수수료·세금은 반영하지 않습니다.

---

## 1. 지표가 계산되는 위치

| 지표 | 계산 위치 | 입력 데이터 |
|------|-----------|-------------|
| **CAGR**, **MDD**, `valueHistory` | 백엔드 `getPortfolioSummary` | 거래(Transaction) 시퀀스 + Mock 가격 |
| **Volatility**, **Sharpe**, **Sortino**, **Calmar** | 프론트 `risk-analysis/page.tsx` | API가 준 `valueHistory`·`cagr`·`mdd` |
| **Volatility**, **Sharpe** (요약) | 프론트 `PortfolioSummarySection.tsx` | 동일 `valueHistory` 기반 |

백엔드는 **포트폴리오 요약 API 한 번**으로 핵심 시계열을 만들고, 프론트는 그 위에서 **리스크 분석용 2차 지표**를 붙입니다.

---

## 2. 지표 용어 · 공식

### 2.1 CAGR (Compound Annual Growth Rate, 연평균 성장률)

**의미:** 투자 기간 전체의 성장을 **1년 단위 수익률**로 환산한 값입니다. “연복리로 몇 % 불었는가”에 가깝게 읽습니다.

**구현:** `backend/src/controllers/portfolio.controller.ts`

```
투자원금 = 모든 BUY 거래의 (수량 × 단가) 합
ratio    = 현재 총평가액 / 투자원금
years    = (현재 시각 − 최초 거래일) / 365.25일

years < 0.25 (약 3개월 미만):
  CAGR ≈ ratio − 1          # 기간이 짧아 연율화가 과도하게 튜는 것을 방지

그 외:
  CAGR = ratio^(1 / years) − 1
```

**한계**

- **매도로 인출한 현금·추가 입금**을 별도 현금흐름으로 보정하지 않습니다 (총 BUY 금액을 원금으로 봄).
- **현재가는 Mock**이라 실제 ETF 수익률과 다릅니다.

---

### 2.2 MDD (Maximum Drawdown, 최대 낙폭)

**의미:** 과거 **고점(피크)** 대비 가장 크게 떨어진 비율입니다. 음수로 표시되며, **−25%**는 “고점에서 최대 25%까지 하락했다”는 뜻입니다.

**구현:** 백엔드, 거래가 발생할 때마다 포트폴리오 총평가 스냅샷을 쌓은 뒤:

```
각 시점 평가액 V_t (거래 후 보유 수량 × Mock 현재가)
peak = max(peak, V_t)
drawdown_t = (V_t − peak) / peak
MDD = min(drawdown_t)   # 가장 작은(가장 큰 하락) 값
```

**참고:** 스냅샷 시점마다 **그 시점의 Mock 현재가**로 전체 포지션을 재평가합니다 (과거 시점 가격 고정이 아님). 학습용 **근사 MDD**입니다.

---

### 2.3 Volatility (연율 변동성)

**의미:** 평가액이 얼마나 **들쭉날쭉한지**를 나타냅니다. 값이 클수록 단기 손익의 폭이 넓다고 해석합니다.

**구현:** 프론트, `valueHistory` 인접 시점 수익률:

```
r_i = V_i / V_{i-1} − 1
μ   = r 의 평균
σ   = r 의 표준편차 (모집단 분산, n으로 나눔)
Volatility(%) = σ × √252 × 100
```

`√252`는 **거래 스냅샷 간격을 거래일(252일) 기준으로 연율화**하는 단순 가정입니다. 실제 일별 종가가 아닙니다.

**대시보드·리스크 분석 공통 임계값 (UI)**

| 수준 | Volatility |
|------|------------|
| HIGH | ≥ 22% |
| MEDIUM | ≥ 15% |
| LOW | 그 미만 |

---

### 2.4 Sharpe Ratio (샤프 비율, 단순형)

**의미:** **변동(리스크) 1단위당** 평균 수익이 얼마나 나왔는지 보는 지표입니다. 높을수록 “흔들림 대비 효율”이 좋다고 봅니다.

**구현:**

```
Sharpe = (μ / σ) × √252
```

- **무위험 수익률 0%** 가정 (국채 금리 미반영).
- Volatility와 동일한 `r_i` 시퀀스 사용.

**임계값 (리스크 분석·대시보드 요약)**

| 수준 | Sharpe |
|------|--------|
| HIGH (나쁨) | < 0.7 |
| MEDIUM | < 1.0 |
| LOW (양호) | ≥ 1.0 |

---

### 2.5 Sortino Ratio · Calmar Ratio (리스크 분석 전용)

**Sortino:** 하락한 수익률만으로 하방 변동을 잰 뒤, Sharpe와 비슷하게 `μ / σ_down × √252`. 상승 변동은 “나쁜 변동”으로 치지 않습니다.

**Calmar:**

```
Calmar = |CAGR(%)| / |MDD(%)|    (MDD가 0이 아닐 때)
```

CAGR 대비 최대 낙폭이 얼마나 컸는지 보는 **단순 효율 지표**입니다.

---

## 3. AI Recommendation (규칙 기반 조언)

### 3.1 “AI”의 의미 (중요)

이 프로젝트의 **AI Recommendation은 LLM·외부 AI API를 사용하지 않습니다.**

- OpenAI 등 **모델 호출 없음**
- **if–else 규칙**으로 지표가 임계값을 넘으면, 미리 작성된 일본어 문구를 붙입니다
- UI 라벨은 “AI”이지만, 문서·면접에서는 **Rule-based recommendation / 규칙 기반 리스크 조언**으로 설명하는 것을 권장합니다

### 3.2 표시 위치

| 위치 | 내용 |
|------|------|
| **`/risk-analysis`** | **AI Recommendation** 카드 — 지표별 이유·권장·기대 효과(최대 3건) |
| **`/dashboard`** | `aiInsightOneLiner` — 리스크 수준에 따른 **한 줄 요약** |

구현: `frontend/app/risk-analysis/page.tsx` (`aiRecommendations` useMemo),  
`frontend/app/dashboard/components/PortfolioSummarySection.tsx` (`aiInsightOneLiner`).

### 3.3 판단 규칙 (우선순위대로 최대 3건)

| 조건 | level | indicator | 권장 방향 (요지) |
|------|-------|-----------|------------------|
| MDD ≤ **−25%** | high | MDD | 채권 ETF 비중 확대 등 하락 방어 |
| Volatility ≥ **22%** | high | Volatility | 고변동 자산 비중 축소·분산 |
| Sharpe < **0.7** | medium | Sharpe | 저상관 자산 추가로 효율 개선 |
| 최대 종목 비중 ≥ **40%** | medium | Concentration | 상위 종목 35% 미만으로 리밸런싱 |
| 위 조건 모두 해당 없음 | low | Overall | 정기 적립·월간 리밸런스 유지 |

`expectedEffect`에 나오는 “○%에서 △%로 개선 **見込み**”는 **시뮬레이션 카피**이며, 모델이 미래 수익을 예측한 값이 **아닙니다**.

### 3.4 대시보드 한 줄 인사이트

`riskSnapshot.level` (MDD·Volatility·Sharpe 종합)이 **HIGH / MEDIUM / LOW**일 때 고정 문구를 선택합니다. 리스크 분석 페이지의 상세 카드보다 **짧은 요약**입니다.

---

## 4. 실무와의 차이 (면접·README용 한 줄)

| 항목 | 본 프로젝트 | 실무에 가까운 방향 |
|------|-------------|-------------------|
| 가격 | Mock | Bloomberg / 거래소 API |
| CAGR | BUY 합계 기준 단순 연율 | 현금흐름·배당·세후 |
| MDD | 거래 시점 Mock 재평가 | 일별 시가총액 기준 |
| Volatility | 거래 간격 수익률 × √252 | 일별 로그수익률 |
| Sharpe | 무위험 0% | 국채·T-bill 차감 |
| AI Recommendation | 규칙 엔진 | 리스크 모델·컴플라이언스 검토 |

---

## 5. 관련 코드 경로

```
backend/src/controllers/portfolio.controller.ts   # CAGR, MDD, valueHistory
backend/src/services/price.service.ts             # Mock 가격
frontend/app/risk-analysis/page.tsx               # 2차 지표, AI Recommendation
frontend/app/dashboard/components/PortfolioSummarySection.tsx  # 요약 지표, 한 줄 인사이트
```

리밸런싱 로직은 [business-logic.ko.md](./business-logic.ko.md)를 참고하세요.
