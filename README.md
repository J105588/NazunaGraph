# NazunaGraph

文化祭向けの在庫管理プラットフォーム。Next.js 16 (App Router) と Supabase を基盤とし、高度なリアルタイム同期と堅牢な自律型セキュリティ機能を提供する。

## システム概要

文化祭における「各団体」と「商品（アイテム）」を効率的に管理し、来場者に対してリアルタイムなステータス情報を提供するWebアプリケーションである。

## 技術スタック

*   **Frontend**: Next.js 16.1.3 (App Router), React 19.2.3, Tailwind CSS v4, Framer Motion
*   **Backend / Database**: Supabase (PostgreSQL, Auth, Storage, Realtime)
*   **State Management**: TanStack Query (React Query) v5
*   **Security**: 自律型 IP ロックアウトシステム, ハニーポットトラップ (Honeypot Trap), 行レベルセキュリティ (RLS), アカウント強制ログアウト監視
*   **UI Components**: Lucide React, Glassmorphism Design System

## 主要機能

### 1. パブリックビュー（ゲスト向け）
来場者がアクセスするフロントエンド画面。ログイン不要で、会場の「今」の混雑状況や販売ステータスを直感的に把握できる。
*   **リアルタイム・ステータス表示**:
    *   **販売中 (Selling)**: 緑・エメラルド系。
    *   **残りわずか (Few Left)**: 黄・オレンジ系。
    *   **完売 (Sold Out)**: 赤色。
    *   **準備中 (Preparing)**: グレーアウトされ、詳細画面へのアクセスが制限される。
    *   *Supabase Realtime により、管理側の操作がミリ秒単位で反映される。*
*   **ステータス判定ロジック (Status Logic)**:
    フロントエンドは各団体の全アイテムの状態を解析し、以下の優先順位で団体の「総合ステータス」を決定する。
    1.  **販売中**: 販売可能なアイテムが1つでもあれば「販売中」となる。
    2.  **残りわずか**: 注意すべきアイテム（残りわずか）がある場合に適用される。
    3.  **準備中**: 全アイテムが非公開または準備中の場合、団体ページ自体へのリンクが無効化される。
    4.  **完売**: 全てのアイテムが完売ステータスの場合に適用される。

### 2. 管理ダッシュボード
関係者がログインして使用する高機能な管理画面。役割ベースのアクセス制御（RBAC）が適用される。
*   **管理者 (Admin)**:
    *   **全体統括**: すべてのユーザー、団体、アイテムの作成・編集・削除権限を持つ。
    *   **ステータス定義**: 「販売中」「完売」などの状態定義、カラーコード、表示優先順位をGUIから自在に設定可能。
    *   **カテゴリ定義**: 商品カテゴリの管理・並べ替え。
    *   **システムリセット**: デモやテスト用に、システム全体のデータを初期化する管理者専用機能。
    *   **ユーザー招待**: メールアドレスによる新規管理者・団体の招待機能。
    *   **メンテナンス制御**: システム全体のメンテナンスモードのオン・オフ切り替え。
    *   **強制ログアウト**: 特定ユーザーを強制的にログアウトさせ、セッションを破棄させる機能。
*   **団体 (Group)**:
    *   **団体情報管理**: 自身のプロフィール、アイコン、商品説明のみを編集可能。他団体のデータは閲覧不能。
    *   **在庫操作**: スマホやタブレットに最適化されたUIで、現場からワンタップで「完売」などのステータス切り替えが可能。ただし、管理者により編集ロック (`is_admin_locked`) されているアイテムは編集できない。

### 3. 自律型セキュリティシステム (Alpha-9 Security System)
ブルートフォース攻撃や不正アクセスに対し、自律的な防衛機構を備えている。
*   **24時間IPロックアウト**:
    *   不正なログイン試行やセキュリティ違反を検知すると、そのIPアドレスを即座に「24時間ロックアウト」する。
    *   ブラウザの Local Storage や Cookie を削除しても解除できないよう、サーバーサイド（`x-forwarded-for` / `x-real-ip`）で厳密にIPを検証する。
*   **ハニーポットトラップ (Honeypot Trap)**:
    *   `/.env`, `/wp-admin`, `tsconfig.json`, `middleware.ts` など、通常ブラウザからアクセスされることのない機密パスやシステムファイルへの不審なアクセス（トラップ）を監視する。
    *   トラップを検出した場合、該当IPアドレスからのアクセスを即座に遮断し、自動的に24時間のIPロックアウトを実施する。
*   **リアルタイム強制ログアウト**:
    *   管理者がユーザープロファイル内の `force_logout_at` カラムを更新すると、クライアント側（`SessionGuard`）が Supabase Realtime を介して即座に変更を検知する。
    *   検知と同時に、セキュリティイベントを記録した上で該当セッションを破棄（`signOut`）し、ログイン画面へと遷移させる。さらに、該当クライアントのローカルストレージに24時間のロックアウトタイムスタンプを設定し、再ログインを防止する。
*   **セキュリティ監査ログ**:
    *   すべてのロックアウトイベントや強制ログアウトイベントは、`security_logs` テーブルに詳細（IP、User Agent、理由、タイムスタンプ）が記録される。
*   **緊急解除キー**:
    *   管理者は、環境変数で設定された `ADMIN_SECURITY_KEY` を使用して、誤ってロックされたIPをGUIから解除（`resolved_at` カラムの更新によるソフトデリート）できる。

### 4. メンテナンスシステム
*   **リアルタイム監視と自動遷移**:
    *   `system_settings` テーブル内の `maintenance_mode` の値を常時監視する。
    *   管理者によってメンテナンスモードが有効化された場合、Supabase Realtime によるイベント検知および15秒ごとのポーリングフォールバックにより、アクセス中の一般ユーザーを即座に `/maintenance` 画面へ自動遷移させる。
*   **管理者例外アクセス**:
    *   管理者（`admin` ロール）はメンテナンスモード中であっても制限を受けず、通常通り管理ダッシュボードやパブリックビューにアクセスし、システム操作を行うことができる。

## データベース設計とセキュリティポリシー (RLS)

本システムは、Supabaseの行レベルセキュリティ (RLS) を最大限に活用し、データベースレベルでの強固なセキュリティを担保している。

### 主なテーブル構成
*   **`profiles`**: ユーザープロファイル情報を保持する。ロール（`admin` / `group`）および強制ログアウト日時 (`force_logout_at`) を格納する。
    *   *RLS*: 全ユーザーが参照可能。プロファイルの更新は所有者本人のみ可能。
*   **`status_definitions`**: 商品のステータス定義（ラベル、カラーコード、優先順位）を保持する。
    *   *RLS*: 全ユーザーが参照可能。管理人のみ作成・編集・削除が可能。
*   **`categories`**: 商品カテゴリ情報を保持する。
    *   *RLS*: 全ユーザーが参照可能。管理人のみ管理可能。
*   **`items`**: 商品データを保持する。管理者ロック状態を示す `is_admin_locked` フラグを持つ。
    *   *RLS*: 全ユーザーが参照可能。管理者は全データの編集が可能。団体（所有者）は `is_admin_locked` が `false` の場合に限り、自らの商品データのみ更新可能。
*   **`system_settings`**: メンテナンスモードなどのシステム設定を管理する。
    *   *RLS*: 全ユーザーが参照可能。更新は管理者のみ可能。
*   **`security_logs`**: セキュリティイベントおよびIPロックアウト情報を記録する。
    *   *RLS*: 特権実行（Service Role）およびサーバーアクション経由でのみ書き込み・参照可能。

### 自動連携トリガー
*   `auth.users` に新規ユーザーが登録された際、トリガー `on_auth_user_created` が起動し、自動的に `public.profiles` テーブルへレコードが作成される。

## 外部連携API (Public Items API)

外部のデジタルサイネージ、外部ディスプレイ表示、案内パネル等の外部連携を目的とした、公開商品（アイテム）データ取得APIを提供する。

### エンドポイント概要

- **URL**: `/api/items`
- **HTTP メソッド**: `GET`
- **認証**: 不要（公開API）
- **CORS**: 有効 (`Access-Control-Allow-Origin: *`) - 外部ドメインのフロントエンドから直接 fetch 可能。
- **キャッシュ制御**: データベースの負荷軽減と高速運用のために、CDNおよびブラウザキャッシュを有効にしている。
  - `Cache-Control: public, s-maxage=5, stale-while-revalidate=10` (5秒間完全キャッシュ、その後10秒間はバックグラウンドで再検証)

### リクエストパラメータ (クエリパラメータ)

以下のクエリパラメータを任意で組み合わせることで、取得データを絞り込むことが可能。

| パラメータ名 | 型 | 必須 | 説明 | 例 |
| :--- | :--- | :---: | :--- | :--- |
| `owner_id` | UUID | 任意 | 特定の出店・展示団体（プロフィールID）の商品のみに絞り込む。 | `?owner_id=56533f04-9dae-41de-bd18-d8919985cafe` |
| `category_id` | 整数 (int) | 任意 | 特定のカテゴリーIDに属する商品のみに絞り込む。 | `?category_id=1` |
| `status_id` | 整数 (int) | 任意 | 特定のステータスID（販売中、完売など）に属する商品のみに絞り込む。 | `?status_id=2` |
| `limit` | 整数 (int) | 任意 | 取得する最大件数を制限する。 | `?limit=5` |

### レスポンスフォーマット

#### 正常系レスポンス (200 OK)
JSON配列形式で、商品データのリストが返される。各商品オブジェクトには、関連する**ステータス定義**、**カテゴリー情報**、**所有する団体情報（プロフィール）**がネストして含まれる。

##### レスポンス JSON 例:
```json
[
  {
    "id": "ab97c43b-b0bc-40fc-849a-3b8832e38a71",
    "name": "オリジナルクリアファイル",
    "description": "今年のポスターデザインを使用した限定クリアファイルです。",
    "image_url": "https://mdmlwzmkzeellsxyibeg.supabase.co/storage/v1/object/public/item-images/aa259ec3-6433-45bc-afed-403eda6a5c29/0.37589308830324264.png",
    "updated_at": "2026-01-19T06:32:54.180828+00:00",
    "category_id": 1,
    "status_id": 1,
    "owner_id": "aa259ec3-6433-45bc-afed-403eda6a5c29",
    "status": {
      "id": 1,
      "color": "bg-green-500",
      "label": "販売中"
    },
    "category": {
      "id": 1,
      "name": "オリジナルグッズ"
    },
    "owner": {
      "id": "aa259ec3-6433-45bc-afed-403eda6a5c29",
      "image_url": "https://mdmlwzmkzeellsxyibeg.supabase.co/storage/v1/object/public/item-images/profile-aa259ec3-6433-45bc-afed-403eda6a5c29/0.8146146121600195.png",
      "group_name": "なずな祭実行委員会",
      "description": "なずな祭の公式物販ブースです。",
      "display_name": "公式物販ブース"
    }
  }
]
```

#### 異常系レスポンス

##### 1. サーバーエラー (500 Internal Server Error)
データベースへの接続エラーや予期せぬ不具合が発生した場合に返される。
```json
{
  "error": "Failed to fetch items",
  "details": "エラーメッセージの詳細"
}
```

##### 2. セキュリティロックアウト (403 Forbidden)
リクエストしたクライアントのIPアドレスがシステム防御機能によってロックされている場合、またはハニーポットトラップ（不正アクセス検知）を踏んだ場合に、JSON形式でアクセス拒否が返される。
```json
{
  "error": "Access denied: Your IP address is locked"
}
```
または
```json
{
  "error": "Access denied: Honeypot trap triggered"
}
```

### クライアント側の実装例 (JavaScript)

外部ディスプレイ等で表示する場合の、最もシンプルな fetch 処理の実装サンプル。

```javascript
async function getActiveItems() {
  const url = 'https://[Your-Domain]/api/items?status_id=1&limit=10';
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const items = await response.json();
    console.log('取得した商品データ:', items);
    
    items.forEach(item => {
      console.log(`商品名: ${item.name} (${item.owner.display_name}) - ステータス: ${item.status.label}`);
    });
  } catch (error) {
    console.error('API取得エラー:', error);
  }
}
```

## ディレクトリ構造

*   `app/(public)`: ゲスト向け公開ページ（認証不要）
*   `app/(dashboard)`: 管理ダッシュボード（認証必須、ロール制限あり）
*   `app/(auth)`: ログイン・サインアウト処理
*   `app/actions`: サーバーアクション群（管理者機能、セキュリティ制御）
*   `app/api`: 外部連携用APIエンドポイント
*   `app/locked`: セキュリティロックアウト画面
*   `app/maintenance`: メンテナンス画面
*   `components`: 共通UIコンポーネント（Glass Card, モーダル, ボタン等）
*   `supabase`: データベース移行用SQLファイル群およびスキーマ定義
*   `utils/supabase`: Supabaseクライアント生成用ユーティリティ

## 開発・セットアップ

### 前提条件
*   Node.js v20 以上
*   Supabase プロジェクト（PostgreSQL、Auth、Storage、Realtimeの設定が必要）

### 環境変数設定 (`.env.local`)
リポジトリルートに `.env.local` ファイルを作成し、以下の変数を定義する。

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # セキュリティログの書き込み、管理者操作の実行に必須（外部非公開）
ADMIN_SECURITY_KEY=your_secret_unlock_key       # 誤検知されたIPのロック解除時にGUIから入力する秘密鍵
```

### インストール & 起動

依存関係のインストール：
```bash
npm install
```

開発サーバーの起動：
```bash
npm run dev
```

---
© 2026 なずな祭実行委員会 & Junxiang Jin. All rights reserved.
