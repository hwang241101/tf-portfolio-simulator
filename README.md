# ETF Portfolio Simulator

금융 포트폴리오·리밸런싱을 **시뮬레이션**하는 풀스택 웹 애플리케이션입니다.  
실제 주문·실시간 시세 연동이 아닌, **목표 비율 대비 매수·매도 계획**과 **대시보드·리스크 관점**을 다루는 **포트폴리오용 프로젝트**입니다.

|                |                                                    |
| -------------- | -------------------------------------------------- |
| **Live Demo**  | https://tf-portfolio-simulator.vercel.app          |
| **Demo Video** | [demo-full.mp4](./docs/assets/video/demo-full.mp4) |
| **UI 언어**    | 일본어 (학습·데모 목적)                            |

<video src="./docs/assets/video/demo-full.mp4" controls width="720"></video>

> 촬영 목록·파일명: [docs/assets/README.md](./docs/assets/README.md)

---

## 1. 프로젝트 개요

### 목적

- 프론트엔드 경험(React / TypeScript / Next.js)에 더해 **금융 도메인 이해**, **백엔드 API 설계**, **클라우드 배포**를 한 번에 보여 주는 포트폴리오
- 단순 CRUD가 아니라 **거래 누적 → 평가·비율 → 리밸런싱 계획**처럼 “돈이 움직이는 로직”을 코드로 표현

### 주요 기능

| 기능            | 설명                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **대시보드**    | 포트폴리오 요약, 자산 구성·지표 시각화                                                                                                                |
| **포트폴리오**  | 시드된 포트폴리오·거래를 전제로, **투자 성향 프리셋**(공격·균형·안정형) **변경** 시 목표 배분(Allocation) 일괄 갱신, 거래(Transaction) 확인·추가·삭제 |
| **리밸런싱**    | 목표 비율 vs 현재 평가 기준 **Preview → Apply** (매수·매도 수량 산출)                                                                                 |
| **리스크 분석** | CAGR·MDD·Volatility·Sharpe 등 지표, 차트, **규칙 기반 AI Recommendation**(LLM 미사용)                                                                 |

### 화면 미리보기 (2×2)

|                                대시보드                                |                                        리밸런싱                                        |
| :--------------------------------------------------------------------: | :------------------------------------------------------------------------------------: |
|        ![대시보드](./docs/assets/screenshots/01-dashboard.png)         |           ![리밸런싱](./docs/assets/screenshots/04-rebalancing-preview.png)            |
|                              리스크 지표                               |                                   AI Recommendation                                    |
| ![리스크 지표](./docs/assets/screenshots/06-risk-analysis-metrics.png) | ![AI Recommendation](./docs/assets/screenshots/07-risk-analysis-ai-recommendation.png) |

### 역할

- 기획·구현·배포 **단독** (프론트 / 백엔드 / DB / 인프라)

### 개발 시 활용한 AI 도구

앱 안의 **「AI Recommendation」**(규칙 기반 조언)과는 **별개**로, **이 레포를 만들 때** 아래 도구를 보조적으로 사용했습니다.

| 도구                                   | 용도                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| **[Cursor](https://cursor.com)**       | IDE 내 코드 작성·리팩터링, EB/Vercel 배포 이슈 디버깅, README·docs 초안             |
| **[ChatGPT](https://chat.openai.com)** | AWS·Prisma·네트워크(Mixed Content) 등 개념 정리, 에러 메시지 해석, 문서 문장 다듬기 |

## 2. 기술 선택 (Why & 기대 효과)

| 기술                        | 선택 이유                                    | 기대·실제 결과                                   |
| --------------------------- | -------------------------------------------- | ------------------------------------------------ |
| **Next.js 16 (App Router)** | 대시보드·다중 페이지, 배포 친화적 SSR/라우팅 | 화면별 라우트 분리, Vercel 원클릭 배포           |
| **TypeScript**              | 프론트·백 타입 안정성, 포트폴리오 코드 품질  | API 응답·도메인 타입 공유 (`frontend/app/types`) |
| **MUI + MUI X Charts**      | 테이블·차트·폼을 빠르게 구성                 | 대시보드·리스크 화면 시각화                      |
| **Express 5**               | 익숙한 REST API, 가벼운 백엔드               | 포트폴리오·거래·리밸런싱 엔드포인트              |
| **Prisma 7 + MySQL**        | 스키마·마이그레이션·타입 생성                | RDS 연동, `seed`로 데모 데이터                   |
| **Zod**                     | 요청 바디 검증                               | 잘못된 입력 조기 차단                            |

> 상세 설계 의도: [docs/architecture.md](./docs/architecture.md)

---

## 3. 인프라 & 배포

로컬 개발과 **프로덕션에 가까운 배포**를 분리해 구성했습니다.

```
[브라우저]
    │  HTTPS
    ▼
[Vercel — Next.js]
    │  /api-proxy/*  (서버 Route Handler)
    │  HTTP
    ▼
[AWS Elastic Beanstalk — Node.js API]
    │
    ▼
[AWS RDS — MySQL]
```

![아키텍처](./docs/assets/diagrams/08-architecture-aws-vercel.png)

| 구성 요소             | 역할                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| **Vercel**            | 프론트 호스팅, HTTPS 제공                                                  |
| **`/api-proxy`**      | Vercel(HTTPS) → Beanstalk(HTTP) **Mixed Content** 우회, 동일 출처 API 호출 |
| **Elastic Beanstalk** | Express API zip 배포, `npm install` + `node dist/src/app.js`               |
| **RDS (MySQL)**       | 포트폴리오·거래·배분 영속화                                                |
| **환경 변수**         | EB: `DATABASE_URL` / Vercel: `API_PROXY_TARGET` (또는 EB URL fallback)     |

### 배포·운영에서 겪은 점 (요약)

- `t3.micro`에서 `npm install` **OOM(exit 137)** → 인스턴스 **t3.small** 상향
- `DATABASE_URL` 구성 변경 시 배포 타임아웃·인스턴스 교체 → 로그로 원인 추적
- 브라우저 직접 `http://` API 호출 실패 → **프록시 Route**로 해결

> 백엔드 배포·zip: `backend`에서 `npm run zip:eb`  
> 상세: [docs/backend.md](./docs/backend.md)

---

## 4. 프로젝트·화면 구성

### 저장소 구조

```
etf-simulator/
├── frontend/          # Next.js UI
│   ├── app/
│   │   ├── dashboard/     # 대시보드
│   │   ├── portfolio/     # 배분·거래·프리셋 변경(메인)
│   │   ├── rebalancing/   # 리밸런싱
│   │   ├── risk-analysis/
│   │   └── api-proxy/     # Vercel → EB 프록시
│   └── app/lib/api.ts     # API 클라이언트
├── backend/           # Express + Prisma
│   ├── src/
│   │   ├── controllers/ # portfolio, transaction, rebalance, …
│   │   └── routes/
│   └── prisma/          # schema, migrations, seed
└── docs/              # 상세 문서
```

### 화면 흐름 (데모 권장 순서)

데모·기본 사용은 **RDS 시드 데이터가 이미 있는 상태**를 가정합니다. 빈 포트폴리오에서의 온보딩(첫 방문 전용 화면)은 다루지 않습니다.

1. **`/dashboard`** — 시드된 포트폴리오 요약·차트
2. **`/portfolio`** — 투자 성향 **프리셋 변경**(공격·균형·안정형), 배분·거래 확인·수정
3. **`/rebalancing`** — Preview → Apply
4. **`/risk-analysis`** — 지표 카드·성장/낙폭 차트·**AI Recommendation**(임계값 규칙, 최대 3건)

사이드바에서 **포트폴리오 ID** 전환 시 전 화면 데이터 연동.

### 화면 스크린샷

| 순서 | 파일                                                               | 들어갈 그림 내용                            |
| ---- | ------------------------------------------------------------------ | ------------------------------------------- |
| 1    | `docs/assets/screenshots/01-dashboard.png`                         | 대시보드 — 총평가·CAGR/MDD·구성 차트 전체   |
| 2    | `docs/assets/screenshots/02-portfolio-preset.png`                  | 포트폴리오 — 투자 성향 프리셋 선택/적용 UI  |
| 3    | `docs/assets/screenshots/03-portfolio-allocation-transactions.png` | 포트폴리오 — 배분·거래 테이블               |
| 4    | `docs/assets/screenshots/04-rebalancing-preview.png`               | 리밸런싱 — Preview BUY/SELL 목록            |
| 5    | `docs/assets/screenshots/05-rebalancing-after-apply.png`           | 리밸런싱 — Apply 후(토스트 또는 변화, 선택) |
| 6    | `docs/assets/screenshots/06-risk-analysis-metrics.png`             | 리스크 분석 — 지표 카드·차트                |
| 7    | `docs/assets/screenshots/07-risk-analysis-ai-recommendation.png`   | 리스크 분석 — AI Recommendation 카드        |

#### 대시보드

![01-dashboard](./docs/assets/screenshots/01-dashboard.png)

#### 포트폴리오 — 프리셋

![02-portfolio-preset](./docs/assets/screenshots/02-portfolio-preset.png)

#### 포트폴리오 — 배분·거래

![03-portfolio-allocation-transactions](./docs/assets/screenshots/03-portfolio-allocation-transactions.png)

#### 리밸런싱 — Preview

![04-rebalancing-preview](./docs/assets/screenshots/04-rebalancing-preview.png)

#### 리밸런싱 — Apply 후

![05-rebalancing-after-apply](./docs/assets/screenshots/05-rebalancing-after-apply.png)

#### 리스크 분석 — 지표

![06-risk-analysis-metrics](./docs/assets/screenshots/06-risk-analysis-metrics.png)

#### 리스크 분석 — AI Recommendation

![07-risk-analysis-ai-recommendation](./docs/assets/screenshots/07-risk-analysis-ai-recommendation.png)

> 지표 정의·공식·AI 규칙: [docs/metrics-and-recommendations.md](./docs/metrics-and-recommendations.md)

> 프론트 상세: [docs/frontend.md](./docs/frontend.md)

---

## 5. 비즈니스 로직 · 한계 · 고민

### 핵심: 리밸런싱

1. 포트폴리오의 **목표 배분(Allocation)** 과 **거래(Transaction)** 를 읽음
2. 거래 누적으로 **종목별 보유 수량·평가** 계산 (가격은 mock/마지막 체결가 기반)
3. 전체 평가 대비 목표 비율과의 차이로 **BUY / SELL 수량** 산출
4. **Preview**: 계획만 JSON 반환 / **Apply**: 계획을 `Transaction` 으로 저장

```
목표 금액 = 전체 평가 × 목표 비율
차이     = 목표 금액 − 현재 평가  →  (+) BUY / (−) SELL
```

### 의도적으로 단순화한 부분 (한계)

| 항목          | 현재                     | 이유                                         |
| ------------- | ------------------------ | -------------------------------------------- |
| 시세          | Mock / 마지막 거래가     | 외부 API·라이선스 범위 밖에서 로직 검증 우선 |
| 수수료·세금   | 미반영                   | 시뮬레이터 범위 축소                         |
| 환율          | 기본 통화(JPY) 중심      | NISA·엔화 투자 시나리오는 향후 확장          |
| 리스크 프리셋 | 프론트 localStorage + UI | 빠른 UX 데모, 서버 정책 엔진은 미구현        |

### 지표 · AI Recommendation (요약)

| 지표           | 한 줄 설명                          | 계산 위치                             |
| -------------- | ----------------------------------- | ------------------------------------- |
| **CAGR**       | 투자 기간 성장을 연율로 환산        | 백엔드 (BUY 합계·현재 평가·기간)      |
| **MDD**        | 고점 대비 최대 하락률               | 백엔드 (거래 시점 평가 곡선)          |
| **Volatility** | 평가액 흔들림(연율 %)               | 프론트 (`valueHistory` 수익률 × √252) |
| **Sharpe**     | 변동 대비 수익 효율(무위험 0% 가정) | 프론트                                |

**AI Recommendation**은 `/risk-analysis` 하단 카드와 대시보드 **한 줄 인사이트**로 표시됩니다.  
**LLM이 아니라** MDD·Volatility·Sharpe·종목 집중도가 임계값을 넘으면 **미리 정의한 문구**를 최대 3건 보여 주는 **규칙 엔진**입니다.

> 용어·공식·임계값·코드 경로: [docs/metrics-and-recommendations.md](./docs/metrics-and-recommendations.md)  
> 리밸런싱 수식: [docs/business-logic.md](./docs/business-logic.md)

### 고민했던 점

- **계산을 프론트가 아닌 백엔드에 둠** → Preview/Apply 결과 일관성
- **소액 차이 노이즈** → 리밸런싱 plan에서 미미한 diff 제외
- **Apply 시 즉시 Transaction 생성** → “실제 주문”이 아닌 **시뮬레이션 기록**임을 README·UI에서 구분
- **“AI” 라벨 vs 규칙 엔진** → UI는 짧게 “AI”, 문서·면접에서는 **규칙 기반**임을 명시해 오해 방지

---

## 6. 이 프로젝트에서 배운 점

로컬에서만 되던 것을 **클라우드까지 한 번 이어 붙이면서** 겪은 내용입니다. 키워드만 나열하기보다, **무엇이 문제였고 무엇을 하면 해결되는지** 위주로 정리했습니다.

### 6.1 배포는 “코드 올리기” 한 번으로 끝나지 않는다

**한 일**

- 백엔드는 `backend`를 zip으로 묶어 **Elastic Beanstalk**에 올리고, DB는 **RDS(MySQL)** 로 분리했습니다.
- 맥에서 `prisma migrate deploy`로 스키마를 맞춘 뒤, `prisma db seed`로 데모용 포트폴리오·거래 데이터를 넣었습니다.
- RDS는 **보안 그룹**으로 “Beanstalk EC2에서만 3306 접속” + “개발 PC IP(마이그레이션용)”를 허용해야 했습니다.

**배운 점**

- API 서버와 DB는 **역할이 다르고**, 둘 다 “켜 두는 것”과 “서로 통신 허용”을 **각각** 설정해야 합니다.
- 배포된 API가 빈 배열 `[]`만 주는 경우, 코드 버그가 아니라 **DB에 데이터가 없거나 `DATABASE_URL`이 비어 있는 경우**도 많다는 걸 구분하는 연습이 됐습니다.

---

### 6.2 프로덕션 장애는 로그를 봐야 하고, 로그도 항상 남지는 않는다

**겪은 일**

- Beanstalk 배포가 자주 실패했고, 이벤트에는 `TimedOut`, `Died`, `None of the instances are sending data` 같은 메시지가 떴습니다.
- `eb-engine.log`에서 `npm install`이 **`Killed`(종료 코드 137)** 로 끊긴 것을 확인했고, 원인은 **인스턴스 메모리 부족(OOM)** 이었습니다. `t3.micro` → `t3.small`로 올리니 설치가 통과했습니다.
- 실패 직후 **인스턴스가 교체**되면, “죽은 그 순간”의 로그가 zip에 안 들어오는 경우가 있어, **성공한 새 인스턴스 로그만** 보게 되기도 했습니다.

**배운 점**

- “배포 실패”는 하나의 이유가 아니라, **npm 설치 / 앱 기동 / 헬스체크 / 환경 변수** 중 어디에서 멈췄는지 로그로 쪼개 봐야 합니다.
- CloudWatch 로그 스트리밍을 켜 두면, 인스턴스가 사라진 뒤에도 추적하기 쉽다는 걸 알게 됐습니다.

---

### 6.3 HTTPS 사이트에서 HTTP API를 직접 부르면 브라우저가 막는다

**겪은 일**

- Vercel(`https://…vercel.app`)에서 Beanstalk API(`http://…elasticbeanstalk.com`)를 **브라우저가 직접** 호출하면, Network에 요청 URL은 보이는데 응답이 없거나 `Failed to fetch`, JSON 파싱 에러(`<!DOCTYPE…`)가 났습니다.
- 원인은 **Mixed Content**(보안상 HTTPS 페이지 → HTTP API 호출 차단)였습니다. CORS만 열어도 해결되지 않습니다.

**해결**

- 브라우저는 **같은 도메인**인 `https://…vercel.app/api-proxy/...` 만 호출하고,
- Vercel 서버의 **Route Handler**가 내부에서 `http://` EB API로 요청을 넘기도록 했습니다.

**배운 점**

- “프론트 배포”와 “API 배포”를 **각각 성공**시켜도, **브라우저에서 붙는 방식**까지 맞춰야 end-to-end가 됩니다.
- API에 HTTPS(ACM 등)를 붙이거나, **프록시(BFF)** 로 우회하는 선택지가 있다는 걸 체감했습니다.

---

### 6.4 환경 변수는 “이름”과 “노출 범위”를 구분해야 한다

**겪은 일**

- `NEXT_PUBLIC_`이 붙은 값은 **빌드 시 프론트 번들에 들어가** 브라우저에서 볼 수 있습니다. EB URL을 여기 넣어도 Mixed Content는 그대로입니다.
- Vercel에는 **`API_PROXY_TARGET`**(서버만 읽음)을 두고, 프론트는 `/api-proxy`만 쓰도록 나눴습니다.
- 변수만 추가하고 **Redeploy를 안 하면** 예전 빌드가 돌아가서, “분명 넣었는데 안 된다”가 반복됐습니다.

**배운 점**

- **클라이언트용 / 서버용** env를 나누고, 바꾼 뒤에는 **재배포가 필요한지**까지 포함해 체크리스트를 갖는 게 좋습니다.

---

### 6.5 금융·시뮬레이터 UI는 “계산이 맞는지 보이게” 만드는 게 중요하다

**한 일**

- 리밸런싱은 **Preview(계획만)** 와 **Apply(거래 기록 반영)** 를 나눴고, 대시보드에서는 요약·비율·차트로 결과를 보여 줍니다.
- 포트폴리오 화면에서는 시드된 데이터 위에서 **프리셋 변경 → 목표 배분 갱신** 흐름을 두었습니다.

**배운 점**

- 숫자 로직만 맞추는 것보다, 사용자(또는 면접관)가 **BUY/SELL·비율 변화를 눈으로 따라갈 수 있는 화면**이 있어야 “시뮬레이터”로 신뢰가 생깁니다.
- mock 가격·세금 미반영 같은 **한계는 README와 UI 톤으로 분명히** 하는 편이 좋습니다. “실거래”와 혼동되지 않게요.

---

## 7. 향후 개선 · 아직 부족한 점

- [ ] 실시간/일봉 ETF 시세 API 연동 (Yahoo Finance 등)
- [ ] 수수료·슬리피지·세금 시뮬레이션
- [ ] EB ALB + ACM으로 API **HTTPS** 직접 제공 (프록시 의존 감소)
- [ ] 핵심 리밸런싱·요약 API **단위/통합 테스트**
- [ ] 인증(JWT)·사용자별 포트폴리오 분리
- [ ] CI/CD (GitHub Actions → EB/Vercel)
- [ ] README·UI **일본어 정리** (현재 UI는 일본어, 문서는 한국어 → 완성 시 일본어 README 병기 예정)

---

## 로컬 실행

### 사전 요건

- Node.js 20+
- MySQL (로컬 또는 RDS)

### Backend

```bash
cd backend
# .env 에 DATABASE_URL 설정 (예: mysql://user:pass@localhost:3306/etf_simulator)
npm install
npx prisma migrate deploy
npm run db:seed        # 데모 데이터 (선택)
npm run dev            # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
# API 기본값: http://localhost:4000 (NEXT_PUBLIC_API_BASE_URL 미설정 시)
```

### Prisma Studio

```bash
cd backend
npx prisma studio
```

---

## 문서

| 문서                                                                    | 내용                                                |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| [architecture.md](./docs/architecture.md)                               | 설계 의도·데이터 흐름                               |
| [business-logic.md](./docs/business-logic.md)                           | 리밸런싱 수식                                       |
| [metrics-and-recommendations.md](./docs/metrics-and-recommendations.md) | CAGR·MDD·Volatility·Sharpe, AI Recommendation(규칙) |
| [backend.md](./docs/backend.md)                                         | API·배포                                            |
| [frontend.md](./docs/frontend.md)                                       | 화면·상태                                           |
| [assets/README.md](./docs/assets/README.md)                             | 스크린샷·동영상 파일명·촬영 가이드                  |

---

## 라이선스

개인 포트폴리오 용도. 상업적 재사용 시 별도 문의.
