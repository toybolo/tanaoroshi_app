# 棚卸し在庫管理アプリ

物販・在庫管理における「棚卸し（実地棚卸）」を楽にするための Web アプリです。
商品ごとに在庫数・販売価格・仕入価格を管理し、定期的な棚卸しで
「帳簿上の在庫」と「実際に数えた在庫」の差異を素早く把握できます。

## 技術構成

| レイヤー | 技術 |
|---|---|
| フロント / API | Next.js（App Router）+ TypeScript |
| デザイン | Tailwind CSS |
| DB / 認証 / ストレージ | Supabase（PostgreSQL / Auth / Storage） |
| アクセス制御 | Supabase RLS |
| バーコード読取 | html5-qrcode |
| CSV 入出力 | papaparse |
| グラフ | recharts |
| ホスティング | Vercel |

## 主な機能

- 認証（メール＋パスワード、未ログイン時はログイン画面へリダイレクト）
- 商品マスタ CRUD・一覧・検索・並び替え・カテゴリフィルタ・画像アップロード
- 集計ダッシュボード（在庫評価額・想定粗利・カテゴリ別グラフ）
- 棚卸しモード（帳簿在庫スナップショット・カウント・差異ハイライト・履歴）
- バーコード / QR スキャンによる数量入力
- CSV インポート / エクスポート
- PWA 対応（ホーム画面に追加可能）

## セットアップ

1. 依存関係をインストール
   ```bash
   npm install
   ```
2. `.env.local.example` をコピーして `.env.local` を作成し、Supabase の接続情報を設定
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. Supabase の SQL Editor で `supabase/schema.sql` を実行（テーブル・RLS・Storage バケットを作成）
4. 開発サーバーを起動
   ```bash
   npm run dev
   ```
5. [http://localhost:3000](http://localhost:3000) を開く

## デプロイ

GitHub リポジトリを Vercel にインポートし、環境変数
（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SITE_URL`）
を設定するとデプロイできます。Supabase の Authentication → URL Configuration に
本番 URL を登録してください。
