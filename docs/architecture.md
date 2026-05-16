# Architecture

[한국어](./architecture.ko.md)

## 1. 概要 (Overview)

本プロジェクトはフロントエンドとバックエンドを分離したフルスタック構成です。

- Frontend: Next.js（UI とデータ可視化）
- Backend: Node.js + Express（ビジネスロジック）
- Database: MySQL（データ永続化）

---

## 2. システム構造 (System Architecture)

[Frontend] → [Backend API] → [Database]

- フロントエンドは REST API でバックエンドと通信します。
- すべてのコアビジネスロジックはバックエンドで処理します。

---

## 3. 設計意図 (Design Decisions)

### 3.1 フロント / バックを分けた理由

- 関心の分離 (Separation of Concerns)
- 保守性の向上
- 将来の拡張性

---

### 3.2 ビジネスロジックをバックエンドに置く理由

- 計算ロジックの重複防止
- データ一貫性の維持
- 金融計算の信頼性確保

👉 特に投資収益率・リバランス計算はクライアントではなくサーバーで処理する設計

---

### 3.3 Prisma を選んだ理由

- 型安全性
- スキーマベースのデータ管理
- 開発生産性の向上

---

## 4. データフロー (Data Flow)

1. ユーザーがポートフォリオを作成
2. 投資履歴（Transaction）を入力
3. バックエンドで:
   - 現在の資産価値を計算
   - 資産比率を計算
4. リバランス API で売買金額を返却

---

## 5. 拡張の検討 (Scalability)

- ETF 価格の外部 API 連携（例: Yahoo Finance）
- 為替処理（JPY → USD）
- 認証システム（JWT ログイン）

---

## 6. 設計原則 (Key Principle)

金融計算の一貫性と信頼性のため、  
**すべてのコアビジネスロジックをバックエンドに集約する構造**としています。

---

## 7. トレードオフ (Trade-offs)

- マイクロサービスではなく単一サーバー（複雑度低減）
- GraphQL ではなく REST API（明確さ・単純さ優先）
