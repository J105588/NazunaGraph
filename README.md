# NazunaGraph

市川学園文化祭向けの在庫管理プラットフォーム。
Next.js 16 (App Router) と Supabase を基盤とし、高度なリアルタイム同期、堅牢なセキュリティを提供する。

## システム概要

本システムは、文化祭における「各団体」と「商品」を管理し、来場者に対してリアルタイムなステータス情報を提供するWebアプリケーションである。

### 技術スタック (Tech Stack)

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion
*   **Backend / Database**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
*   **State Management**: TanStack Query (React Query)
*   **Security**: Custom IP-based Lockout System, RLS (Row Level Security)
*   **UI Components**: Lucide React, Glassmorphism Design System

## 主要機能

### 1. パブリックビュー（ゲスト向け）

来場者がアクセスするフロントエンド画面。ログイン不要で、会場の「今」を直感的に把握できる。

*   **リアルタイム・ステータス表示**:
    *   **販売中 (Selling)**: 緑・エメラルド系。
    *   **残りわずか (Few Left)**: 黄・オレンジ系。
    *   **完売 (Sold Out)**: 赤色。
    *   **準備中 (Preparing)**: グレーアウトされ、アクセスが制限される。
    *   *これらはSupabase Realtimeにより、管理側の操作がミリ秒単位で反映される。*

### 2. ダッシュボード（管理・運用者向け）

関係者がログインして使用する高機能管理画面。役割ベースのアクセス制御（RBAC）が適用される。

*   **管理者 (Admin)**:
    *   **全体統括**: 全てのユーザー、団体、アイテムの作成・編集・削除権限。
    *   **ステータス定義**: 「販売中」「完売」などの状態定義、色コード、優先順位をGUIで自由に設定可能。
    *   **システムリセット**: デモやテスト用に、システム全体のデータを初期化する管理者専用機能。
    *   **ユーザー招待**: メールアドレスによる新規管理者・団体の招待機能。
*   **団体 (Group)**:
    *   **自社管理**: 自身のプロフィール、アイコン、商品説明のみを編集可能。他団体のデータは閲覧不能。
    *   **在庫操作**: スマホ・タブレットに最適化されたUIで、現場からワンタップで「完売」切り替えが可能。

### 3. セキュリティシステム (Security & Defense)

本システムは、ブルートフォース攻撃や不正アクセスに対し、自律的な防衛機構を備えている。

*   **24時間IPロックアウト**:
    *   不正なログイン試行やセキュリティ違反を検知すると、そのIPアドレスを即座に「24時間ロックアウト」する。
    *   攻撃者がブラウザのLocal StorageやCookieを削除しても解除できないよう、サーバーサイド（`x-forwarded-for` / `x-real-ip`）で厳密にIPを検証。
*   **セキュリティ監査ログ**:
    *   全てのロックアウトイベントは `security_logs` テーブルに記録される（IP、User Agent、理由、タイムスタンプ）。
*   **緊急解除キー**:
    *   管理者は、環境変数で設定された `ADMIN_SECURITY_KEY` を使用して、誤ってロックされたIPをGUIから解除できる。

### 4. メンテナンスシステム

*   **計画メンテナンス**: 開始・終了予定時刻を設定し、ユーザーに告知画面を表示。
*   **無期限メンテナンス**: 終了時刻未定の緊急メンテナンスモード対応。
*   **リアルタイム監視**: ユーザーが画面を開いたままでも、メンテナンス開始と同時に自動的にメンテナンス画面へ遷移する。

## システムアーキテクチャ

### ステータス判定ロジック (Status Logic)

フロントエンドは各団体の全アイテムの状態を解析し、以下の優先順位で団体の「総合ステータス」を決定する。

1.  **販売中**: 販売可能なアイテムが1つでもあれば「販売中」。
2.  **残りわずか**: 注意すべきアイテムがあれば表示。
3.  **準備中**: 全アイテムが非公開/準備中の場合、団体ページ自体へのリンクを無効化。
4.  **完売**: 全てのアイテムが完売ステータスの場合。

### データフロー

1.  **Server Components**: 初回描画時に最新データをフェッチし、高速にHTMLを生成 (SSR/ISR)。
2.  **Client Hydration**: ブラウザでReactが起動後、Supabase Realtimeに接続。
3.  **Realtime Updates**: DBの変更検知 -> クライアントのキャッシュ無効化 -> UIの即時再描画。

## ディレクトリ構造

*   `app/(public)`: ゲスト向け公開ページ (Login不要)
*   `app/(dashboard)`: 管理画面 (Auth必須)
*   `app/(auth)`: ログイン処理
*   `app/actions`: Server Actions (Security, Data Mutation)
*   `app/locked`: セキュリティロックアウト画面
*   `app/maintenance`: メンテナンス画面
*   `components`: 共通UI (Glass Cards, Modals, Buttons)
*   `utils/supabase`: Supabase Client Generators

## 開発・セットアップ

### 前提条件

*   Node.js v20+
*   Supabase Project

### 環境変数 (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # Admin操作・Security Log用
ADMIN_SECURITY_KEY=your_secret_unlock_key       # ロック解除用キー
```

### インストール & 実行

```bash
npm install
npm run dev
```

---
© 2026 市川学園 & Junxiang Jin. All rights reserved.
