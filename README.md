# ETF Portfolio Simulator

[한국어 README](./README.ko.md)

金融ポートフォリオとリバランスを**シミュレーション**するフルスタック Web アプリケーションです。  
実際の注文やリアルタイム相場連携ではなく、**目標比率に対する売買計画**と**ダッシュボード・リスクの可視化**に焦点を当てた**ポートフォリオ用プロジェクト**です。

|               |                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Live Demo** | _(現在クラウドデプロイ停止 — 下記 **デモ動画**・**スクリーンショット**・[ローカル実行](#ローカル実行) を参照)_                                                                       |
| **デモ動画**  | [demo-full.mp4](https://github.com/hwang241101/tf-portfolio-simulator/blob/main/docs/assets/video/demo-full.mp4) _(GitHub ファイルページ・10MB 超はブラウザ再生不可、Raw ダウンロード)_ |
| **UI 言語**   | 日本語（学習・デモ目的）                                                                                                                                                              |

> 撮影一覧・ファイル名: [docs/assets/README.md](./docs/assets/README.md)

---

## 1. プロジェクト概要

### 目的

- フロントエンド（React / TypeScript / Next.js）に加え、**金融ドメインの理解**、**バックエンド API 設計**、**クラウドデプロイ**を一度に示すポートフォリオ
- 単純な CRUD ではなく、**取引の蓄積 → 評価・比率 → リバランス計画**という「お金が動くロジック」をコードで表現

### 主な機能

| 機能               | 説明                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ダッシュボード** | ポートフォリオ概要、資産構成・指標の可視化                                                                                                                |
| **ポートフォリオ** | シード済みデータを前提に、**投資スタイルプリセット**（積極・均衡・安定）**変更**で目標配分（Allocation）を一括更新、取引（Transaction）の確認・追加・削除 |
| **リバランス**     | 目標比率と現在評価に基づく **Preview → Apply**（売買数量の算出）                                                                                          |
| **リスク分析**     | CAGR・MDD・Volatility・Sharpe などの指標、チャート、**ルールベース AI Recommendation**（LLM 未使用）                                                      |

### 画面プレビュー（2×2）

|                            ダッシュボード                             |                                       リバランス                                       |
| :-------------------------------------------------------------------: | :------------------------------------------------------------------------------------: |
|     ![ダッシュボード](./docs/assets/screenshots/01-dashboard.png)     |          ![リバランス](./docs/assets/screenshots/04-rebalancing-preview.png)           |
|                              リスク指標                               |                                   AI Recommendation                                    |
| ![リスク指標](./docs/assets/screenshots/06-risk-analysis-metrics.png) | ![AI Recommendation](./docs/assets/screenshots/07-risk-analysis-ai-recommendation.png) |

### 役割

- 企画・実装・デプロイを**単独**で担当（フロント / バックエンド / DB / インフラ）

### 開発時に利用した AI ツール

アプリ内の **「AI Recommendation」**（ルールベースの助言）とは**別**に、**本リポジトリを作る際**に以下を補助的に使用しました。

| ツール                                 | 用途                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| **[Cursor](https://cursor.com)**       | IDE 内のコーディング・リファクタ、EB/Vercel デプロイ問題のデバッグ、README・docs の下書き    |
| **[ChatGPT](https://chat.openai.com)** | AWS・Prisma・ネットワーク（Mixed Content）の整理、エラーメッセージの解釈、ドキュメントの推敲 |

---

## 2. 技術選定（Why & 期待効果）

| 技術                        | 選定理由                                                      | 期待・実際の結果                                   |
| --------------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **Next.js 16 (App Router)** | ダッシュボード・複数ページ、デプロイしやすい SSR/ルーティング | 画面ごとのルート分離、Vercel ワンクリックデプロイ  |
| **TypeScript**              | フロント・バックの型安全性、ポートフォリオとしてのコード品質  | API 応答・ドメイン型の共有（`frontend/app/types`） |
| **MUI + MUI X Charts**      | テーブル・チャート・フォームの迅速な構築                      | ダッシュボード・リスク画面の可視化                 |
| **Express 5**               | 馴染みのある REST API、軽量バックエンド                       | ポートフォリオ・取引・リバランスのエンドポイント   |
| **Prisma 7 + MySQL**        | スキーマ・マイグレーション・型生成                            | RDS 連携、`seed` によるデモデータ                  |
| **Zod**                     | リクエストボディの検証                                        | 不正入力の早期ブロック                             |

> 設計意図の詳細: [docs/architecture.md](./docs/architecture.md)

---

## 3. インフラ & デプロイ

ローカル開発と**本番に近いデプロイ**を分離して構成しました。以下は当時の本番構成であり、**現在はコスト削減のため AWS（EB・RDS）などのクラウドリソースを終了**した状態です。

![アーキテクチャ](./docs/assets/diagrams/08-architecture-aws-vercel.png)

| 構成要素              | 役割                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Vercel**            | フロントホスティング、HTTPS 提供                                                     |
| **`/api-proxy`**      | Vercel(HTTPS) → Beanstalk(HTTP) の **Mixed Content** 回避、同一オリジン API 呼び出し |
| **Elastic Beanstalk** | Express API の zip デプロイ、`npm install` + `node dist/src/app.js`                  |
| **RDS (MySQL)**       | ポートフォリオ・取引・配分の永続化                                                   |
| **環境変数**          | EB: `DATABASE_URL` / Vercel: `API_PROXY_TARGET`（または EB URL フォールバック）      |

### デプロイ・運用で経験したこと（要約）

- `t3.micro` で `npm install` が **OOM（exit 137）** → インスタンスを **t3.small** に変更
- `DATABASE_URL` 変更時のデプロイタイムアウト・インスタンス入れ替え → ログで原因を追跡
- ブラウザから `http://` API を直接呼ぶと失敗 → **プロキシ Route** で解決

> バックエンドの zip デプロイ: `backend` で `npm run zip:eb`  
> 詳細: [docs/backend.md](./docs/backend.md)

---

## 4. プロジェクト・画面構成

### リポジトリ構造

```
etf-simulator/
├── frontend/          # Next.js UI
│   ├── app/
│   │   ├── dashboard/     # ダッシュボード
│   │   ├── portfolio/     # 配分・取引・プリセット変更（メイン）
│   │   ├── rebalancing/   # リバランス
│   │   ├── risk-analysis/
│   │   └── api-proxy/     # Vercel → EB プロキシ
│   └── app/lib/api.ts     # API クライアント
├── backend/           # Express + Prisma
│   ├── src/
│   │   ├── controllers/ # portfolio, transaction, rebalance, …
│   │   └── routes/
│   └── prisma/          # schema, migrations, seed
└── docs/              # 詳細ドキュメント
```

### データモデル（要約）

`User` → `Portfolio` → **`Allocation`**（目標比率）/ **`Transaction`**（売買記録）、ETF 銘柄は **`Asset`** マスタで管理します。スキーマ: `backend/prisma/schema.prisma`

### 主要 API

| Method                    | パス                                | 説明                                          |
| ------------------------- | ----------------------------------- | --------------------------------------------- |
| `GET`                     | `/portfolios`                       | ポートフォリオ一覧                            |
| `GET`                     | `/portfolios/:id/summary`           | 概要・CAGR・MDD・`valueHistory`               |
| `POST`                    | `/portfolios/:id/rebalance/preview` | リバランス計画のみ返却                        |
| `POST`                    | `/portfolios/:id/rebalance/apply`   | 計画を `Transaction` として保存               |
| `GET` / `POST` / `DELETE` | `/transactions`                     | 取引の参照・追加・削除（`portfolioId` クエリ） |
| `GET` / `POST` / `DELETE` | `/allocations`                      | 目標配分の参照・更新・削除（`portfolioId` クエリ） |
| `GET`                     | `/assets`                           | ETF 銘柄マスタ                                |

### 画面フロー（デモ推奨順）

デモ・通常利用は **RDS のシードデータが既にある状態**を前提とします。空のポートフォリオ向けオンボーディング（初回専用画面）は扱いません。

1. **`/dashboard`** — シード済みポートフォリオの概要・チャート
2. **`/portfolio`** — 投資スタイル**プリセット変更**（積極・均衡・安定）、配分・取引の確認・編集
3. **`/rebalancing`** — Preview → Apply
4. **`/risk-analysis`** — 指標カード・成長/ドローダウンチャート・**AI Recommendation**（閾値ルール、最大 3 件）

サイドバーで **ポートフォリオ ID** を切り替えると全画面のデータが連動します。

### 画面スクリーンショット

| 順  | ファイル                                                           | 内容                                            |
| --- | ------------------------------------------------------------------ | ----------------------------------------------- |
| 1   | `docs/assets/screenshots/01-dashboard.png`                         | ダッシュボード — 総評価・CAGR/MDD・構成チャート |
| 2   | `docs/assets/screenshots/02-portfolio-preset.png`                  | ポートフォリオ — 投資スタイルプリセット UI      |
| 3   | `docs/assets/screenshots/03-portfolio-allocation-transactions.png` | ポートフォリオ — 配分・取引テーブル             |
| 4   | `docs/assets/screenshots/04-rebalancing-preview.png`               | リバランス — Preview の BUY/SELL 一覧           |
| 5   | `docs/assets/screenshots/06-risk-analysis-metrics.png`             | リスク分析 — 指標カード・チャート               |
| 6   | `docs/assets/screenshots/07-risk-analysis-ai-recommendation.png`   | リスク分析 — AI Recommendation カード           |

#### ダッシュボード

![01-dashboard](./docs/assets/screenshots/01-dashboard.png)

#### ポートフォリオ — プリセット

![02-portfolio-preset](./docs/assets/screenshots/02-portfolio-preset.png)

#### ポートフォリオ — 配分・取引

![03-portfolio-allocation-transactions](./docs/assets/screenshots/03-portfolio-allocation-transactions.png)

#### リバランス — Preview

![04-rebalancing-preview](./docs/assets/screenshots/04-rebalancing-preview.png)

#### リスク分析 — 指標

![06-risk-analysis-metrics](./docs/assets/screenshots/06-risk-analysis-metrics.png)

#### リスク分析 — AI Recommendation

![07-risk-analysis-ai-recommendation](./docs/assets/screenshots/07-risk-analysis-ai-recommendation.png)

> 指標の定義・式・AI ルール: [docs/metrics-and-recommendations.md](./docs/metrics-and-recommendations.md)

> フロント詳細: [docs/frontend.md](./docs/frontend.md)

---

## 5. ビジネスロジック · 限界 · 検討事項

### 中核: リバランス

1. ポートフォリオの **目標配分（Allocation）** と **取引（Transaction）** を読み込む
2. 取引の蓄積から **銘柄別の保有数量・評価** を計算（価格は mock / 最終約定価ベース）
3. 全体評価に対する目標比率との差から **BUY / SELL 数量** を算出
4. **Preview**: 計画のみ JSON で返却 / **Apply**: 計画を `Transaction` として保存

```
目標金額 = 全体評価 × 目標比率
差分     = 目標金額 − 現在評価  →  (+) BUY / (−) SELL
```

### 意図的に簡略化した部分（限界）

| 項目             | 現状                       | 理由                                               |
| ---------------- | -------------------------- | -------------------------------------------------- |
| 相場             | Mock / 最終取引価          | 外部 API・ライセンスの範囲外でロジック検証を優先   |
| 手数料・税金     | 未反映                     | シミュレータの範囲を絞る                           |
| 為替             | 基本通貨（JPY）中心        | NISA・円建てシナリオは将来拡張                     |
| リスクプリセット | フロント localStorage + UI | 迅速な UX デモ、サーバー側ポリシーエンジンは未実装 |

### 指標 · AI Recommendation（要約）

| 指標           | 一言説明                                     | 計算場所                                   |
| -------------- | -------------------------------------------- | ------------------------------------------ |
| **CAGR**       | 投資期間の成長を年率換算                     | バックエンド（BUY 合計・現在評価・期間）   |
| **MDD**        | ピークからの最大下落率                       | バックエンド（取引時点の評価曲線）         |
| **Volatility** | 評価額のぶれ（年率 %）                       | フロント（`valueHistory` リターン × √252） |
| **Sharpe**     | 変動に対するリターン効率（無リスク 0% 仮定） | フロント                                   |

**AI Recommendation** は `/risk-analysis` 下部カードとダッシュボードの**一行インサイト**に表示されます。  
**LLM ではなく**、MDD・Volatility・Sharpe・銘柄集中度が閾値を超えたときに**事前定義の文言**を最大 3 件示す**ルールエンジン**です。

> 用語・式・閾値・コードパス: [docs/metrics-and-recommendations.md](./docs/metrics-and-recommendations.md)  
> リバランスの式: [docs/business-logic.md](./docs/business-logic.md)

### 検討した点

- **計算をフロントではなくバックエンドに置く** → Preview/Apply の結果の一貫性
- **小さな差分のノイズ** → リバランス plan で微小な diff を除外
- **Apply で即 Transaction 作成** → 「実注文」ではなく**シミュレーション記録**であることを README・UI で区別
- **「AI」ラベル vs ルールエンジン** → UI は短く「AI」、README・説明では**ルールベース**と明記して誤解を防ぐ

---

## 6. このプロジェクトで学んだこと

### 6.1 技術選定

技術スタック・選定理由は [§2 技術選定](#2-技術選定why--期待効果) を参照してください。この規模では **単一 API + REST** で十分で、マイクロサービス・GraphQL は説明コストだけ増えると感じました。

---

### 6.2 画面構成: デモの順番に合わせてページを分ける

**やったこと**

- **`/dashboard`** — 概要・CAGR/MDD・構成チャート・リスク一行インサイトで「今の状態」を最初に見せます。
- **`/portfolio`** — プリセット（積極/均衡/安定）変更 → 目標配分更新、取引の確認・追加が**メイン操作画面**です。
- **`/rebalancing`** — **Preview（計画のみ）** と **Apply（記録反映）** を分け、「計算結果」と「シミュレーション反映」を区別しました。
- **`/risk-analysis`** — Volatility・Sharpe・Calmar などの 2 次指標と **AI Recommendation** カードで「数字の後の解釈」を付けました。
- サイドバーの**ポートフォリオ ID 切替**で全画面のデータが連動し、複数のシードポートフォリオをデモしやすくしました。

**学び**

- リバランスのような**リスクのある操作（Apply）** はボタン・段階を分けないと「実注文か？」と誤解されやすいです。

---

### 6.3 UI の仕上げ: 数字と流れが一目でわかるように

**やったこと**

- MUI の**カード・テーブル・チャート**で指標・比率・BUY/SELL 一覧のトーンを揃え、プリセット変更には**確認ダイアログ**を挟みました。
- リバランス Preview 表で**目標比率 vs 現在比率・数量・金額**が同時に見えるようにし、Apply 後はトースト・画面変化で「反映された」フィードバックを出しました。
- リスク画面は指標カード → 成長/ドローダウンチャート → AI Recommendation の順で**上から下に読める**配置にしました。

**学び**

- 金融・シミュレータ UI はロジックだけ正しいより、利用者が**BUY/SELL・比率変化を目で追えるか**が信頼に大きく効きます。
- スクリーンショット・デモ動画を README に載せるときは**シークレット・ブックマークバー非表示・シードデータ読み込み済み**など、UI の仕上げが README の品質までつながると感じました。
- mock 価格・税金未反映などの限界は画面トーン（「シミュレーション」「Preview」）とドキュメントに併記すると「実取引アプリ」と混同されません。

---

### 6.4 デプロイは「コードを上げる」一度で終わらない

**やったこと**

- バックエンドは `backend` を zip にまとめ **Elastic Beanstalk** へ、DB は **RDS（MySQL）** に分離しました。
- Mac から `prisma migrate deploy` でスキーマを合わせ、`prisma db seed` でデモ用ポートフォリオ・取引データを投入しました。
- RDS は**セキュリティグループ**で「Beanstalk EC2 からのみ 3306」「開発 PC の IP（マイグレーション用）」を許可する必要がありました。

**学び**

- API サーバーと DB は**役割が異なり**、「起動する」と「相互に通信を許可する」を**それぞれ**設定する必要があります。
- デプロイ済み API が空配列 `[]` だけ返すとき、コードバグではなく **DB にデータがない、または `DATABASE_URL` が空**のことも多い、と切り分ける練習になりました。

---

### 6.5 本番障害はログを見る必要があり、ログも常に残るわけではない

**経験**

- Beanstalk のデプロイが頻繁に失敗し、イベントに `TimedOut`、`Died`、`None of the instances are sending data` などが出ました。
- `eb-engine.log` で `npm install` が **`Killed`（終了コード 137）** で止まっていることを確認し、原因は**インスタンスのメモリ不足（OOM）**でした。`t3.micro` → `t3.small` でインストールが通りました。
- 失敗直後に**インスタンスが入れ替わる**と、「落ちた瞬間」のログが zip に入らず、**成功した新インスタンスのログだけ**見ることもありました。

**学び**

- 「デプロイ失敗」は単一原因ではなく、**npm インストール / アプリ起動 / ヘルスチェック / 環境変数**のどこで止まったかログで分解する必要があります。
- CloudWatch のログストリーミングを有効にすると、インスタンス消失後も追いやすい、と分かりました。

---

### 6.6 HTTPS サイトから HTTP API を直接呼ぶとブラウザがブロックする

**経験**

- Vercel（`https://…vercel.app`）から Beanstalk API（`http://…elasticbeanstalk.com`）を**ブラウザが直接**呼ぶと、Network に URL は出るのに応答がない、`Failed to fetch`、JSON パースエラー（`<!DOCTYPE…`）が起きました。
- 原因は **Mixed Content**（HTTPS ページから HTTP API 呼び出しのブロック）で、CORS だけでは解決しません。

**解決**

- ブラウザは**同一ドメイン**の `https://…vercel.app/api-proxy/...` のみ呼び、
- Vercel サーバーの **Route Handler** が内部で `http://` の EB API にリクエストを転送するようにしました。

**学び**

- 「フロントのデプロイ」と「API のデプロイ」を**それぞれ成功**させても、**ブラウザからの接続方法**まで揃えて初めて end-to-end になります。
- API に HTTPS（ACM 等）を付けるか、**プロキシ（BFF）** で迂回する選択肢がある、と体感しました。

---

### 6.7 環境変数は「名前」と「露出範囲」を分ける

**経験**

- `NEXT_PUBLIC_` 付きの値は**ビルド時にフロントのバンドルに入り**、ブラウザから見えます。EB URL をここに入れても Mixed Content は変わりません。
- Vercel には **`API_PROXY_TARGET`**（サーバーのみ読む）を置き、フロントは `/api-proxy` のみ使うように分けました。
- 変数を追加しただけで **Redeploy しない**と古いビルドが動き、「入れたのに効かない」が繰り返されました。

**学び**

- **クライアント用 / サーバー用**の env を分け、変更後は**再デプロイが必要か**までチェックリストに含めるのがよい、と分かりました。

---

## 7. 今後の改善 · まだ足りない点

- [ ] リアルタイム/日足 ETF 相場 API 連携（Yahoo Finance 等）
- [ ] 手数料・スリッページ・税金のシミュレーション
- [ ] コアのリバランス・サマリー API の**単体/結合テスト**
- [ ] 認証（JWT）・ユーザー別ポートフォリオ分離
- [ ] CI/CD（GitHub Actions → EB/Vercel）

---

## ローカル実行

### 前提

- Node.js 20+
- MySQL（ローカルまたは RDS）

### Backend

```bash
cd backend
# .env に DATABASE_URL を設定（例: mysql://user:pass@localhost:3306/etf_simulator）
npm install
npx prisma migrate deploy
npm run db:seed        # デモデータ（任意）
npm run dev            # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
# API 既定: http://localhost:4000（NEXT_PUBLIC_API_BASE_URL 未設定時）
```

### Prisma Studio

```bash
cd backend
npx prisma studio
```

---

## ドキュメント

| ドキュメント                                                            | 内容                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| [architecture.md](./docs/architecture.md)                               | 設計意図・データフロー                                     |
| [business-logic.md](./docs/business-logic.md)                           | リバランスの式                                             |
| [metrics-and-recommendations.md](./docs/metrics-and-recommendations.md) | CAGR・MDD・Volatility・Sharpe、AI Recommendation（ルール） |
| [backend.md](./docs/backend.md)                                         | API・デプロイ                                              |
| [frontend.md](./docs/frontend.md)                                       | 画面・状態                                                 |
| [assets/README.md](./docs/assets/README.md)                             | スクリーンショット・動画のファイル名・撮影ガイド           |

> 各 `docs/*.md` は日本語、`docs/*.ko.md` は韓国語です。ルート README の韓国語版は [README.ko.md](./README.ko.md) です。

---

## ライセンス

個人ポートフォリオ用途。商用再利用は別途ご相談ください。
