# AGENTS.md

ニコニコ ボイロ車載動画 初投稿年別＆活動状況データベース (`nico-onboard-viewer`) の開発・保守向けガイドラインです。AIエージェントおよび開発者が作業する際のルールと手順をまとめています。

---

## 1. プロジェクト概要

- **目的**: ニコニコ動画「ボイロ車載動画」ジャンルにおける歴代初投稿者の初投稿・最新投稿動画および活動状況を閲覧・検索できる静的Webデータベース。
- **公開先**: GitHub Pages ([https://estshorter.github.io/nico-onboard-viewer/](https://estshorter.github.io/nico-onboard-viewer/))
- **技術スタック**:
  - フロントエンド: HTML5, Vanilla CSS, Vanilla JavaScript (フレームワークなし)
  - データビルド: Python 3, `pandas` (実行には `uv` を使用)

---

## 2. ファイル構成と役割

| ファイル / ディレクトリ | 役割 |
|---|---|
| [`index.html`](file:///C:/Users/estshorter/src/nico-onboard-viewer/index.html) | メインUIマークアップ。レスポンシブテーブル・検索・フィルタUI |
| [`style.css`](file:///C:/Users/estshorter/src/nico-onboard-viewer/style.css) | スタイリング（ダーク/ライト調和、バッジ、プログレスバー等） |
| [`app.js`](file:///C:/Users/estshorter/src/nico-onboard-viewer/app.js) | クライアント側ロジック（フィルタ、検索、ソート、レンダリング、非表示フィルタ） |
| [`build_data.py`](file:///C:/Users/estshorter/src/nico-onboard-viewer/build_data.py) | 元データから `data.json` / `data.js` / CSV を生成するスクリプト |
| [`excluded_users.json`](file:///C:/Users/estshorter/src/nico-onboard-viewer/excluded_users.json) | 強制非表示（オプトアウト希望）ユーザーIDの設定ファイル |
| [`data.js`](file:///C:/Users/estshorter/src/nico-onboard-viewer/data.js) | `window.NICO_ONBOARD_DATA` を定義するスクリプト（`file://` 直開き時CORS対策） |
| [`data.json`](file:///C:/Users/estshorter/src/nico-onboard-viewer/data.json) | Web配信用JSONデータ |
| [`merged_onboard_users.csv`](file:///C:/Users/estshorter/src/nico-onboard-viewer/merged_onboard_users.csv) | 全投稿者CSV |
| [`merged_active_onboard_users.csv`](file:///C:/Users/estshorter/src/nico-onboard-viewer/merged_active_onboard_users.csv) | 直近1年活動中投稿者CSV |
| [`generate_ogp.py`](file:///C:/Users/estshorter/src/nico-onboard-viewer/generate_ogp.py) | OGP画像 (`ogp.png`) 生成スクリプト |

---

## 3. 開発・実行コマンド

Python環境には **`uv`** を使用してください。

### データ再ビルド
```bash
uv run --with pandas python build_data.py
```

### 簡易ローカルサーバー起動 (テスト用)
```bash
uv run python -m http.server 8000
```
ブラウザで `http://localhost:8000/` を開いて確認。

---

## 4. 特定ユーザーの非表示（オプトアウト）手順

掲載取り下げや非表示リクエストがあった場合は、以下の手順で除外します：

1. **[`excluded_users.json`](file:///C:/Users/estshorter/src/nico-onboard-viewer/excluded_users.json) に追加**
   ```json
   [
     {
       "userId": 280096,
       "reason": "非表示リクエスト"
     },
     {
       "userId": 999999,
       "reason": "非表示リクエスト"
     }
   ]
   ```
2. **[`app.js`](file:///C:/Users/estshorter/src/nico-onboard-viewer/app.js) の `HIDDEN_USER_IDS` に追加**
   ```javascript
   const HIDDEN_USER_IDS = new Set([
     280096,
     999999,
   ]);
   ```
3. **データファイルを再ビルド**
   ```bash
   uv run --with pandas python build_data.py
   ```
4. **コミット & プッシュ**
   ```bash
   git add .
   git commit -m "feat: 非表示ユーザーを追加 (userId: XXXXX)"
   git push origin main
   ```

---

## 5. コーディング規約・設計方針

- **Vanillaファースト**: 外部CDNや重いフレームワークは使用せず、軽量・高速・依存最小限を維持する。
- **データ不整合の防止**: `data.json` と `data.js` は常に `build_data.py` を通じて同時に更新する。
- **XSS対策**: 外部文字列（投稿者名、動画タイトル等）をDOMに挿入する際は、必ず `escapeHtml()` を通すか `textContent` を使用する。
- **アバター画像**: 公式アバターURL形式（`https://usericon.nimg.jp/usericon/{Math.floor(userId/10000)}/{userId}.jpg`）を使用し、エラー時は `DEFAULT_AVATAR` / `FALLBACK_SVG` にフォールバックする。
