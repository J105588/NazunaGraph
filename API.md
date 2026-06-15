# 商品データ取得 API 仕様書 (Public Items API)

本システムで管理されている商品（展示・出店アイテム）データを外部から取得するためのAPIエンドポイント仕様書です。
文化祭のデジタルサイネージ、外部ディスプレイ表示、案内パネル等の外部連携で利用することを想定しています。

---

## 1. エンドポイント概要

- **URL**: `/api/items`
- **HTTP メソッド**: `GET`
- **認証**: 不要（公開API）
- **CORS**: 有効 (`Access-Control-Allow-Origin: *`) - 外部ドメインのフロントエンドから直接 fetch 可能です。
- **キャッシュ制御**: データベースの負荷軽減と高速運用のために、CDN/ブラウザキャッシュを有効にしています。
  - `Cache-Control: public, s-maxage=5, stale-while-revalidate=10` (5秒間完全キャッシュ、その後10秒間はバックグラウンドで再検証)

---

## 2. リクエストパラメータ (クエリパラメータ)

以下のクエリパラメータを任意で組み合わせることで、取得データを絞り込むことができます。

| パラメータ名 | 型 | 必須 | 説明 | 例 |
| :--- | :--- | :---: | :--- | :--- |
| `owner_id` | UUID | 任意 | 特定の出店・展示団体（プロフィールID）の商品のみに絞り込みます。 | `?owner_id=56533f04-9dae-41de-bd18-d8919985cafe` |
| `category_id` | 整数 (int) | 任意 | 特定のカテゴリーIDに属する商品のみに絞り込みます。 | `?category_id=1` |
| `status_id` | 整数 (int) | 任意 | 特定のステータスID（販売中、完売など）に属する商品のみに絞り込みます。 | `?status_id=2` |
| `limit` | 整数 (int) | 任意 | 取得する最大件数を制限します。 | `?limit=5` |

---

## 3. レスポンスフォーマット

### 正常系レスポンス (200 OK)
JSON配列形式で、商品データのリストが返されます。各商品オブジェクトには、関連する**ステータス定義**、**カテゴリー情報**、**所有する団体情報（プロフィール）**がネストして含まれます。

#### レスポンス JSON 例:
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

### 異常系レスポンス

#### 1. サーバーエラー (500 Internal Server Error)
データベースへの接続エラーや予期せぬ不具合が発生した場合に返されます。
```json
{
  "error": "Failed to fetch items",
  "details": "エラーメッセージの詳細"
}
```

#### 2. セキュリティロックアウト (403 Forbidden)
リクエストしたクライアントのIPアドレスがシステム防御機能によってロックされている場合、またはハニーポットトラップ（不正アクセス検知）を踏んだ場合に、JSON 形式でアクセス拒否が返されます。
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

---

## 4. クライアント側の実装例 (JavaScript)

外部ディスプレイ等で表示する場合の、最もシンプルな fetch 処理の実装サンプルです。

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
    
    // UIへの描画処理をここに記述
    items.forEach(item => {
      console.log(`商品名: ${item.name} (${item.owner.display_name}) - ステータス: ${item.status.label}`);
    });
  } catch (error) {
    console.error('API取得エラー:', error);
  }
}
```
