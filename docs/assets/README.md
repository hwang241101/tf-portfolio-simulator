# メディアアセットガイド

[한국어](./README.ko.md)

## フォルダ構造

```
docs/assets/
├── README.md                 ← 日本語（このファイル）
├── README.ko.md              ← 韓国語
├── video/
│   ├── demo-full.mp4         ← メインデモ動画（GitHub・README 上部）
│   └── demo-full-poster.png  ← 動画サムネイル（任意）
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

## ファイル別の撮影内容

| ファイル                                                 | 入れる内容（撮影時の画面）                                                                                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **video/demo-full.mp4**                                  | **60〜90 秒**: ダッシュボード → ポートフォリオ（プリセット変更）→ リバランス Preview·Apply → リスク分析·AI Recommendation。Vercel 本番 URL、データ読み込み済み。 |
| **video/demo-full-poster.png**                           | 動画の最初のフレームまたはダッシュボード代表画面（GitHub で動画読み込み前に表示、任意）                                                                          |
| **screenshots/01-dashboard.png**                         | `/dashboard` — 総評価・CAGR·MDD·資産構成チャート・リスク概要が見える全体                                                                                         |
| **screenshots/02-portfolio-preset.png**                  | `/portfolio` — 投資スタイルプリセット（積極/均衡/安定）選択 UI または適用確認ダイアログ                                                                          |
| **screenshots/03-portfolio-allocation-transactions.png** | `/portfolio` — 目標配分（Allocation）+ 取引（Transaction）タブ/テーブル                                                                                          |
| **screenshots/04-rebalancing-preview.png**               | `/rebalancing` — Preview 結果、BUY/SELL 一覧・数量・金額                                                                                                         |
| **screenshots/05-rebalancing-after-apply.png**           | Apply 直後のトーストまたは適用後の変化（任意、04 と対）                                                                                                          |
| **screenshots/06-risk-analysis-metrics.png**             | `/risk-analysis` — Volatility·CAGR·Sharpe·Calmar カード + 成長/ドローダウンチャート                                                                              |
| **screenshots/07-risk-analysis-ai-recommendation.png**   | `/risk-analysis` 下部 — **AI Recommendation** カード（指標・推奨・期待効果）                                                                                     |
| **diagrams/08-architecture-aws-vercel.png**              | アーキテクチャ図: Browser → Vercel(HTTPS) → `/api-proxy` → EB → RDS（Figma/Excalidraw 等）                                                                       |

## 推奨仕様

| 項目               | 推奨                                                     |
| ------------------ | -------------------------------------------------------- |
| スクリーンショット | PNG、幅 **1280〜1440px**、Retina 2x 可                   |
| 動画               | MP4(H.264)、**1080p 以下**、30〜60 秒で README 用に十分  |
| GIF                | README 用は **10MB 以下**（大きい場合は MP4 のみリンク） |

## 撮影のコツ

- ブラウザ: **シークレット**またはブックマークバー非表示、Vercel **Production URL**
- ポートフォリオ: シードデータのある **#1 または #4**
- 日本語 UI のままにするとデモと README の説明が一致します
