# 指標 · AI Recommendation

[한국어](./metrics-and-recommendations.ko.md)

ダッシュボード・リスク分析画面で使う**収益・リスク指標**と **AI Recommendation** の意味、計算方法、限界をまとめます。

> **共通前提:** 評価価格は `backend/src/services/price.service.ts` の **Mock 現在価**です。リアルタイム市場相場・為替・手数料・税金は反映しません。

---

## 1. 指標が計算される場所

| 指標 | 計算場所 | 入力データ |
|------|----------|------------|
| **CAGR**, **MDD**, `valueHistory` | バックエンド `getPortfolioSummary` | 取引（Transaction）シーケンス + Mock 価格 |
| **Volatility**, **Sharpe**, **Sortino**, **Calmar** | フロント `risk-analysis/page.tsx` | API の `valueHistory`・`cagr`・`mdd` |
| **Volatility**, **Sharpe**（概要） | フロント `PortfolioSummarySection.tsx` | 同じ `valueHistory` ベース |

バックエンドは**ポートフォリオ概要 API 1 回**でコア時系列を作り、フロントはその上に**リスク分析用の 2 次指標**を載せます。

---

## 2. 指標の用語 · 式

### 2.1 CAGR (Compound Annual Growth Rate, 年平均成長率)

**意味:** 投資期間全体の成長を**年率 1 本**に換算した値。「複利で年何 % 増えたか」に近く読めます。

**実装:** `backend/src/controllers/portfolio.controller.ts`

```
投資元本 = すべての BUY 取引の (数量 × 単価) の合計
ratio    = 現在の総評価額 / 投資元本
years    = (現在時刻 − 最初の取引日) / 365.25 日

years < 0.25（約 3 ヶ月未満）:
  CAGR ≈ ratio − 1          # 期間が短く年率化が過大になるのを防ぐ

それ以外:
  CAGR = ratio^(1 / years) − 1
```

**限界**

- **売却による引出し・追加入金**を別のキャッシュフローで補正しません（BUY 合計を元本とみなす）。
- **現在価は Mock** のため実際の ETF 収益率と異なります。

---

### 2.2 MDD (Maximum Drawdown, 最大ドローダウン)

**意味:** 過去の**ピーク**から最も大きく落ちた比率。負で表示され、**−25%** は「ピークから最大 25% 下落した」意味です。

**実装:** バックエンド。取引のたびにポートフォリオ総評価スナップショットを積み:

```
各時点の評価額 V_t（取引後の保有数量 × Mock 現在価）
peak = max(peak, V_t)
drawdown_t = (V_t − peak) / peak
MDD = min(drawdown_t)   # 最も小さい（最大下落）値
```

**参考:** スナップショットごとに**その時点の Mock 現在価**で全ポジションを再評価します（過去価格固定ではない）。学習用の**近似 MDD**です。

---

### 2.3 Volatility（年率ボラティリティ）

**意味:** 評価額がどれだけ**上下するか**。大きいほど短期損益の幅が広いと解釈します。

**実装:** フロント、`valueHistory` 隣接時点のリターン:

```
r_i = V_i / V_{i-1} − 1
μ   = r の平均
σ   = r の標準偏差（母分散、n で割る）
Volatility(%) = σ × √252 × 100
```

`√252` は**取引スナップショット間隔を営業日 252 日基準で年率化**する単純仮定です。実際の日次終値ではありません。

**ダッシュボード・リスク分析共通の閾値（UI）**

| 水準 | Volatility |
|------|------------|
| HIGH | ≥ 22% |
| MEDIUM | ≥ 15% |
| LOW | それ未満 |

---

### 2.4 Sharpe Ratio（シャープレシオ、簡易型）

**意味:** **変動（リスク）1 単位あたり**の平均リターン。高いほど「揺れに対する効率」がよいとみなします。

**実装:**

```
Sharpe = (μ / σ) × √252
```

- **無リスク金利 0%** 仮定（国債金利未反映）。
- Volatility と同じ `r_i` 系列を使用。

**閾値（リスク分析・ダッシュボード概要）**

| 水準 | Sharpe |
|------|--------|
| HIGH（悪い） | < 0.7 |
| MEDIUM | < 1.0 |
| LOW（良好） | ≥ 1.0 |

---

### 2.5 Sortino Ratio · Calmar Ratio（リスク分析専用）

**Sortino:** 下落したリターンだけで下方変動を測り、Sharpe と同様に `μ / σ_down × √252`。上昇変動は「悪い変動」とみなしません。

**Calmar:**

```
Calmar = |CAGR(%)| / |MDD(%)|    （MDD ≠ 0 のとき）
```

CAGR に対する最大下落がどれだけ大きかったかを見る**単純効率指標**です。

---

## 3. AI Recommendation（ルールベースの助言）

### 3.1 「AI」の意味（重要）

本プロジェクトの **AI Recommendation は LLM・外部 AI API を使いません。**

- OpenAI 等の**モデル呼び出しなし**
- **if–else ルール**で指標が閾値を超えると、事前に書いた**日本語**文言を付与
- UI ラベルは「AI」ですが、ドキュメント・面接では **Rule-based recommendation / ルールベースのリスク助言** と説明することを推奨

### 3.2 表示場所

| 場所 | 内容 |
|------|------|
| **`/risk-analysis`** | **AI Recommendation** カード — 指標別の理由・推奨・期待効果（最大 3 件） |
| **`/dashboard`** | `aiInsightOneLiner` — リスク水準に応じた**一行サマリー** |

実装: `frontend/app/risk-analysis/page.tsx`（`aiRecommendations` useMemo）、  
`frontend/app/dashboard/components/PortfolioSummarySection.tsx`（`aiInsightOneLiner`）。

### 3.3 判定ルール（優先順、最大 3 件）

| 条件 | level | indicator | 推奨の方向（要旨） |
|------|-------|-----------|-------------------|
| MDD ≤ **−25%** | high | MDD | 債券 ETF 比率拡大など下落防御 |
| Volatility ≥ **22%** | high | Volatility | 高ボラ資産の比率縮小・分散 |
| Sharpe < **0.7** | medium | Sharpe | 低相関資産追加で効率改善 |
| 最大銘柄比重 ≥ **40%** | medium | Concentration | 上位銘柄を 35% 未満へリバランス |
| 上記すべて非該当 | low | Overall | 定期積立・月次リバランス維持 |

`expectedEffect` の「○% から △% に改善**見込み**」は**シミュレーション用コピー**であり、モデルが将来リターンを予測した値**ではありません**。

### 3.4 ダッシュボード一行インサイト

`riskSnapshot.level`（MDD・Volatility・Sharpe 総合）が **HIGH / MEDIUM / LOW** のとき固定文言を選択。リスク分析ページの詳細カードより**短い要約**です。

---

## 4. 実務との差（面接・README 用の一行）

| 項目 | 本プロジェクト | 実務に近い方向 |
|------|----------------|----------------|
| 価格 | Mock | Bloomberg / 取引所 API |
| CAGR | BUY 合計ベースの単純年率 | キャッシュフロー・配当・税後 |
| MDD | 取引時点 Mock 再評価 | 日次時価総額ベース |
| Volatility | 取引間隔リターン × √252 | 日次ログリターン |
| Sharpe | 無リスク 0% | 国債・T-bill 控除 |
| AI Recommendation | ルールエンジン | リスクモデル・コンプライアンス |

---

## 5. 関連コードパス

```
backend/src/controllers/portfolio.controller.ts   # CAGR, MDD, valueHistory
backend/src/services/price.service.ts             # Mock 価格
frontend/app/risk-analysis/page.tsx               # 2 次指標, AI Recommendation
frontend/app/dashboard/components/PortfolioSummarySection.tsx  # 概要指標, 一行インサイト
```

リバランスロジックは [business-logic.md](./business-logic.md) を参照してください。
