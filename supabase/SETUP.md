# V-Vibe Supabase セットアップ手順

## 1. Supabase プロジェクトを作成

[https://supabase.com](https://supabase.com) → New Project

## 2. 環境変数を設定

`.env.local.example` を `.env.local` にコピーして値を入力。

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

値の取得場所: Supabase ダッシュボード → Settings → API

## 3. DB スキーマを適用

Supabase ダッシュボード → SQL Editor → `supabase/schema.sql` の内容をペーストして実行。

## 4. OAuth プロバイダーを設定

### X (Twitter)

1. [developer.x.com](https://developer.x.com) でアプリを作成
2. コールバック URL を追加:
   `https://<your-project>.supabase.co/auth/v1/callback`
3. Supabase ダッシュボード → Authentication → Providers → Twitter
   → Consumer Key / Consumer Secret を入力して Enable

### Google

1. [console.cloud.google.com](https://console.cloud.google.com) で OAuth クライアントを作成
2. 承認済みリダイレクト URI:
   `https://<your-project>.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google
   → Client ID / Client Secret を入力して Enable

## 5. ローカル開発サーバーを起動

```bash
npm run dev
```

http://localhost:3000 で動作確認。
