# Architecture

## 1. 개요 (Overview)

본 프로젝트는 프론트엔드와 백엔드를 분리한 풀스택 구조로 설계되었습니다.

- Frontend: Next.js (UI 및 데이터 시각화)
- Backend: Node.js + Express (비즈니스 로직 처리)
- Database: MySQL (데이터 영속성 관리)

---

## 2. 시스템 구조 (System Architecture)

[Frontend] → [Backend API] → [Database]

- 프론트엔드는 REST API를 통해 백엔드와 통신합니다.
- 모든 핵심 비즈니스 로직은 백엔드에서 처리됩니다.

---

## 3. 설계 의도 (Design Decisions)

### 3.1 프론트엔드 / 백엔드 분리 이유

- 관심사 분리 (Separation of Concerns)
- 유지보수 용이성 향상
- 향후 확장성 고려

---

### 3.2 비즈니스 로직을 백엔드에 둔 이유

- 계산 로직 중복 방지
- 데이터 일관성 유지
- 금융 계산의 신뢰성 확보

👉 특히 투자 수익률, 리밸런싱 계산은 클라이언트가 아닌 서버에서 처리하도록 설계

---

### 3.3 Prisma를 선택한 이유

- 타입 안정성 확보
- 스키마 기반 데이터 관리
- 개발 생산성 향상

---

## 4. 데이터 흐름 (Data Flow)

1. 사용자가 포트폴리오 생성
2. 투자 내역(Transaction) 입력
3. 백엔드에서:
   - 현재 자산 가치 계산
   - 자산 비율 계산
4. 리밸런싱 API를 통해 매수/매도 금액 반환

---

## 5. 확장 고려 사항 (Scalability)

- ETF 가격 외부 API 연동 (예: Yahoo Finance)
- 환율 처리 (JPY → USD)
- 인증 시스템 추가 (JWT 기반 로그인)

---

## 6. 설계 원칙 (Key Principle)

본 시스템은 금융 계산의 일관성과 신뢰성을 확보하기 위해  
**모든 핵심 비즈니스 로직을 백엔드에 집중시키는 구조로 설계되었습니다.**

---

## 7. 트레이드오프 (Trade-offs)

- 마이크로서비스 대신 단일 서버 구조 선택 (복잡도 감소)
- GraphQL 대신 REST API 선택 (명확성과 단순성 우선)
