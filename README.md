🔥 네 포트폴리오 방향 (확정된 상태)

금융 비즈니스 로직 중심 프로젝트
→ ETF 투자 + 리밸런싱 시뮬레이터

📌 왜 이 방향이 맞냐 (중요)

너 지금 상황 보면:

프론트는 이미 충분히 잘함 (React / TS / Next 3년+)
문제는 “비즈니스 이해 + 백엔드 경험 부족”
목표는 단순 코더 → “금융 도메인 이해하는 엔지니어”

👉 그래서 이 포폴은 단순 CRUD가 아니라
**“돈이 움직이는 로직”**을 다루는 게 핵심임

🧠 포트폴리오 핵심 기능 (이건 꼭 들어가야 함)

1. 투자 시뮬레이션
   초기 자금 설정
   매달 투자금 설정
   ETF 선택 (S&P500, 올컨트리 등)

👉 여기까지는 그냥 기본

2. 🔥 리밸런싱 로직 (핵심)
   목표 비율 (예: 주식 70 / 채권 30)
   실제 비율 계산
   일정 기간마다 자동 리밸런싱

👉 여기서 중요한 포인트:

“얼마를 사고 팔아야 목표 비율 맞는지 계산”
세금 / 수수료 고려하면 더 좋음 3. 수익률 계산
CAGR
MDD (최대 낙폭)
누적 수익률

👉 이건 면접에서 무조건 물어봄

4. 백엔드 (필수)
   Node.js / Express
   DB 저장 (포트폴리오, 투자 기록)
   API 설계

👉 여기서 “프론트 개발자 → 풀스택 느낌” 만들어야 함

5. 배포
   AWS (EC2 + S3 or Vercel + RDS)
   실제 서비스처럼 접근 가능
   🚨 여기서 차별화 포인트 (이거 없으면 의미 없음)

그냥 만들면 흔한 포폴됨
👉 반드시 이 중 1~2개는 넣어

환율 고려 (엔화 → 달러 투자)
일본 투자 기준 (NISA 반영)
리스크 기반 리밸런싱 (변동성 기반)
실제 ETF 데이터 기반 (yfinance 등)
🎯 이 포폴로 노리는 포지션
Fintech 스타트업
금융 DX 회사
데이터 기반 서비스 회사

👉 네가 지원했던
Finatext / Credit Engine 이런 회사들 딱 타겟 맞음

💡 현실적인 평가

지금 너 상태에서 이 포폴 제대로 만들면:

❌ 그냥 프론트 개발자
→
✅ “금융 이해하는 개발자”

로 포지셔닝 바뀜

👉 이 차이 때문에 연봉 100~200만엔 차이 나는 케이스 많음

---

# ETF Portfolio Simulator

금융 투자 포트폴리오 및 리밸런싱 시뮬레이터

## 🚀 Features

- ETF 투자 시뮬레이션
- 자동 리밸런싱 계산
- 수익률 분석 (CAGR, MDD)

## 🏗 Architecture

👉 [Architecture 자세히 보기](./docs/architecture.md)

## 🧠 Business Logic

👉 [리밸런싱 로직 설명](./docs/business-logic.md)

## 🗄 Backend

👉 [Backend 상세](./docs/backend.md)

## 💻 Frontend

👉 [Frontend 상세](./docs/frontend.md)

## 📊 Example Rebalancing Result

| Asset | Action | Amount |
| ----- | ------ | ------ |
| VOO   | SELL   | 10,000 |
| BND   | BUY    | 10,000 |

## ⚙️ Run Locally

### Backend 기동

```bash
cd backend
npm install
npm run dev
```

### Frontend 기동

```bash
cd frontend
npm install
npm run dev
```

### Prisma Studio 기동

```bash
cd backend
npx prisma studio
```

---

🎯 너한테 맞는 진행 순서
1️⃣ Transaction (이미 완료)

👉 이제 간단 UI 붙여

입력 폼 (수량, 가격)
버튼 → POST /transactions

👉 여기서:

API 제대로 동작하는지 눈으로 확인
2️⃣ Portfolio 조회 API 만들기

👉 만들자마자 바로 UI

“현재 자산 총액”
“자산별 비율”
3️⃣ Allocation (목표 비율)

👉 UI로 설정

슬라이더 or 입력
4️⃣ 🔥 리밸런싱

👉 결과 UI가 핵심

BUY / SELL 리스트 보여주기
