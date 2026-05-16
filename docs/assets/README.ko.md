# 미디어 에셋 가이드

[日本語](./README.md)

README·포트폴리오에 넣을 **스크린샷·동영상·다이어그램** 파일명과 촬영 내용입니다.  
파일을 해당 경로에 넣은 뒤, 루트 [README.ko.md](../../README.ko.md)에 연결하면 됩니다.

## 폴더 구조

```
docs/assets/
├── README.md                 ← 일본어 (촬영 가이드)
├── README.ko.md              ← 한국어 (이 파일)
├── video/
│   ├── demo-full.mp4         ← 메인 데모 영상 (GitHub·README 상단)
│   └── demo-full-poster.png  ← 영상 썸네일 (선택)
├── screenshots/
│   ├── 01-dashboard.png
│   ├── 02-portfolio-preset.png
│   ├── 03-portfolio-allocation-transactions.png
│   ├── 04-rebalancing-preview.png
│   ├── 05-rebalancing-after-apply.png
│   ├── 06-risk-analysis-metrics.png
│   └── 07-risk-analysis-ai-recommendation.png
└── diagrams/
    └── 08-architecture-aws-vercel.png
```

## 파일별 촬영 내용

| 파일 | 넣을 내용 (촬영 시 화면) |
|------|---------------------------|
| **video/demo-full.mp4** | **60~90초** 흐름: 대시보드 → 포트폴리오(프리셋 변경) → 리밸런싱 Preview·Apply → 리스크 분석·AI Recommendation. Vercel Live URL, 데이터 로드된 상태. |
| **video/demo-full-poster.png** | 영상 첫 프레임 또는 대시보드 대표 화면 (GitHub에서 영상 로딩 전 표시용, 선택) |
| **screenshots/01-dashboard.png** | `/dashboard` — 총평가액·CAGR·MDD·자산 구성 차트·리스크 요약이 보이는 전체 화면 |
| **screenshots/02-portfolio-preset.png** | `/portfolio` — 투자 성향 프리셋(積極/均衡/安定) 선택 UI 또는 적용 확인 다이얼로그 |
| **screenshots/03-portfolio-allocation-transactions.png** | `/portfolio` — 목표 배분(Allocation) + 거래(Transaction) 탭/테이블이 보이는 화면 |
| **screenshots/04-rebalancing-preview.png** | `/rebalancing` — Preview 결과, BUY/SELL 목록·수량·금액이 보이는 상태 |
| **screenshots/05-rebalancing-after-apply.png** | Apply 직후 성공 토스트 또는 동일 화면에서 적용 후 변화(선택, 04와 쌍) |
| **screenshots/06-risk-analysis-metrics.png** | `/risk-analysis` — Volatility·CAGR·Sharpe·Calmar 카드 + 성장/낙폭 차트 |
| **screenshots/07-risk-analysis-ai-recommendation.png** | `/risk-analysis` 하단 — **AI Recommendation** 카드(지표·권장·기대 효과)가 보이게 |
| **diagrams/08-architecture-aws-vercel.png** | 아키텍처 다이어그램: Browser → Vercel(HTTPS) → `/api-proxy` → EB → RDS (Figma/Excalidraw 등) |

## 권장 사양

| 항목 | 권장 |
|------|------|
| 스크린샷 | PNG, 가로 **1280~1440px**, Retina 2x 가능 |
| 동영상 | MP4(H.264), **1080p 이하**, 30~60초면 README용으로 충분 |
| GIF | README용은 **10MB 이하** (크면 MP4만 링크) |

## 촬영 팁

- 브라우저: **시크릿 창** 또는 북마크바 숨김, Vercel **Production URL**
- 포트폴리오: 시드 데이터 있는 **#1 또는 #4**
- 일본어 UI 그대로 두면 데모와 README 설명이 일치함
