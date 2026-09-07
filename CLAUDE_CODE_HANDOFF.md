# Claude Code 引き継ぎ書 — パッキングリスト

最終更新: 2026-09-07

## 1. 目的

個人用の「旅行・出張パッキングリスト」Webアプリを完成させ、PCとスマートフォンの両方から同じチェック状態を確認できるようにする。

ユーザー名は「まさひろ」。GitHubアカウントは `masahirokby`。

作成済みの空GitHubリポジトリ:

- `https://github.com/masahirokby/packing-list`

作成済みのSupabaseプロジェクト:

- プロジェクト名: `packing-list`
- Project URLとPublishable keyはまだコードへ設定していない
- DB password、Secret key、`service_role` keyは受け取っていないし、受け取る必要もない

## 2. 現在の実装状態

このディレクトリには、ビルド不要の静的PWAとして動く初期実装がある。

- Vanilla HTML/CSS/JavaScript
- JavaScript構文確認済み
- PythonのHTTP serverで静的ファイルが配信できることを確認済み
- Gitローカルリポジトリ作成・コミット済み
- GitHubへのpushは未完了
  - 実行環境にGitHub書き込み認証がなく、`git push`が認証エラーになったため
- SupabaseのSQLは未実行
- GitHub OAuthは未設定
- GitHub Pagesは未設定・未公開

### 主要ファイル

| ファイル | 内容 |
|---|---|
| `index.html` | アプリのエントリーポイント |
| `styles.css` | Calm Modernデザイン、レスポンシブUI |
| `app.js` | 全画面、ローカル保存、Supabase同期、認証 |
| `config.js` | ローカル用Supabase公開設定。現在は空 |
| `supabase/schema.sql` | テーブル、制約、index、RLS policy |
| `sw.js` | PWA用Service Worker |
| `manifest.webmanifest` | PWA manifest |
| `.github/workflows/deploy-pages.yml` | GitHub Pages自動デプロイ |
| `README.md` | セットアップ手順 |

## 3. 確定したプロダクト仕様

### 名称・デザイン

- アプリ名: `パッキングリスト`
- デザイン: `Calm Modern`
- メインカラー: 落ち着いたグリーン
- タイトル横に絵文字 `🧳`
- モバイルファーストだがPCでも利用可能
- PWAとしてホーム画面に追加できるようにする

### メイン画面

選択中の旅行・出張専用パッキングリストを表示する。

- アプリ名
- 旅行・出張の名前または行き先
- 日程
- 準備済み件数と進捗率
- 表示タブ
  - すべて
  - スーツケース
  - バックパック
  - 行先別
- `未確認だけ表示`
- 大きくタップしやすいチェックボックス
- チェック済み項目は取り消し線＋各グループの下へ移動
- チェック状態は即時保存
- `次の未確認へ`ボタンは不要。削除済み

### アプリナビゲーション

下部メニューは2つだけ。

1. `持ち物`
2. `旅行・出張`

`新規作成`は下部メニューに置かない。旅行・出張一覧画面の右上に置く。

### 旅行・出張一覧

- 作成済みの旅行・出張を一覧表示
- 行き先・名前、日程、進捗、準備中／完了を表示
- 一覧の行を押すと、その旅行専用のパッキングリストを開く
- 各行右端に目立たない `•••` メニュー
- `•••` 内に以下を置く
  - 名前と日程を編集
  - 削除（確認必須）
- 全持ち物がチェック済みになると自動的に完了

### 旅行・出張の新規作成

- 行き先・名前
- 出発日
- 帰宅日
- 行先別アイテムの選択
- 作成後は新しい旅行のパッキングリストへ直接移動

### 基本リスト管理

持ち物をコードに書き足さなくても、アプリ画面から管理できること。

- 持ち物の追加
- 名前変更
- カテゴリー変更
- スーツケース／バックパック／行先別の変更
- 表示順変更
- 使用停止／再開
- 基本リストの削除は物理削除ではなく `is_active=false` を基本とする
- 基本リストの変更はデフォルトで今後作成する旅行だけに反映
- 編集時に選んだ場合だけ、準備中の旅行の未チェック項目にも変更を反映
- 過去の旅行のスナップショットは保持する

## 4. データ設計

Supabase/PostgreSQLの3テーブル構成。

### `master_items`

ユーザーごとの基本持ち物。

- `id`
- `user_id`
- `name`
- `category`
- `bag`: `suitcase | backpack | optional`
- `is_optional`
- `is_active`
- `sort_order`
- timestamps

### `trips`

- `id`
- `user_id`
- `name`
- `start_date`
- `end_date`
- `status`: `preparing | completed`
- timestamps

### `trip_items`

旅行作成時点で基本リストをコピーしたスナップショット。

- `id`
- `trip_id`
- `master_item_id`（基本項目との参照。基本項目削除時はnull可）
- `name`
- `category`
- `bag`
- `is_optional`
- `sort_order`
- `checked`
- timestamps

### セキュリティ

- 全テーブルでRLSを有効化
- `anon`には権限を与えない
- `authenticated`ユーザーは自分の行だけCRUD可能
- `trip_items`は親`trips.user_id`を通して所有者を判定
- ブラウザにはProject URLとPublishable keyだけを置く
- Secret keyや`service_role` keyは絶対にブラウザ・GitHub・ログへ置かない

SQLは `supabase/schema.sql` に実装済み。Supabase SQL Editorで実行する。

## 5. 認証・クラウド同期

採用構成:

- UIホスティング: GitHub Pages
- 認証: Supabase Auth + GitHub OAuth
- データ: Supabase Postgres
- オフライン: localStorage + Service Worker

GitHub Pages予定URL:

- `https://masahirokby.github.io/packing-list/`

Supabaseで必要な設定:

1. `supabase/schema.sql`をSQL Editorで実行
2. Authentication > Providers > GitHubを有効化
3. GitHub Settings > Developer settings > OAuth AppsでOAuth Appを作成
4. Homepage URLをGitHub Pages URLにする
5. Authorization callback URLはSupabaseのGitHub Provider画面に表示されるCallback URLを使う
6. Supabase Authentication > URL ConfigurationでGitHub Pages URLをSite URLまたはRedirect URLに登録

GitHubリポジトリで必要なActions Variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Workflowが公開時に`config.js`を生成する。

## 6. 初期持ち物リスト

現在の完全な初期値は `app.js` の `DEFAULT_ITEMS`。

### ユーザーが明示した重要な割り当て

#### スーツケース

- 注射
- 傘
- 白いライブ用ペンライト ×2
- Philips 電動歯ブラシ

#### バックパック

- リップ
- 黒の縦型ボディバッグ
- 予備携帯
- パスポート
- グリーンカード
- 財布・カード類
- 白のiPhone 17
- 家の鍵
- MacBook／充電器
- B&W Px8（Tan）
- スマホ用ポータブルバッテリー

#### 行先によって選択

- クロックス
- 手袋
- ベルト・カフス
- コーヒーセット
- iPad
- スマホホルダー

### 商品・見た目に関する過去の指定

将来、持ち物イラストや商品画像を再導入する場合に参照すること。現在のアプリには商品画像を入れていない。

- グリーンカード: 最新デザイン
- AMEX: Green、Classic Green
- スマートフォン: 白のiPhone 17
- 免許証: California Driver License
- Bowers & Wilkins Px8: Tan
- ショルダーバッグではなく黒の縦型ボディバッグ
- ペンライト: ライブ用の白いもの2本
- 電動歯ブラシ: Philips

## 7. Claude Codeが最初に行うこと

### A. GitHubへコードを入れる

リポジトリが空なら、引き継ぎZIPの中身を展開して以下を実行する。

```powershell
git init -b main
git add .
git commit -m "Initial packing list app"
git remote add origin https://github.com/masahirokby/packing-list.git
gh auth setup-git
git push -u origin main
```

リポジトリに既にファイルがある場合は、まずcloneして内容と履歴を確認し、ユーザーの変更を上書きしないこと。

### B. Supabaseを設定

1. `supabase/schema.sql`をSQL Editorで実行
2. Project URLとPublishable keyを確認
3. GitHub Actions Variablesへ登録
4. GitHub OAuthを設定

### C. GitHub Pagesを有効化

1. Repository Settings > Pages
2. Sourceを`GitHub Actions`にする
3. Actions workflowの完了を確認
4. 公開URLをSupabaseのRedirect URLへ登録

### D. 実機検証

最低限、以下をPCとスマートフォンで確認する。

- GitHubログイン／ログアウト
- 旅行の作成
- 行先別アイテムの選択
- 旅行名・日程の編集
- 旅行の削除
- チェック状態の即時保存
- 別端末での同期
- オフライン時のチェック
- 再接続後の同期
- 基本リストの追加・編集・使用停止・並べ替え
- ライト／ダーク表示
- PWAのホーム画面追加

## 8. 既知の制約・改善候補

初期実装としては動く構成だが、公開前に以下をレビューすること。

1. **同期キュー**
   - 現状はlocalStorageへ即時保存し、オンライン時にSupabaseへupsertする簡易方式。
   - 永続的な操作キュー、競合解決、複数端末同時編集は未実装。
   - 最終更新時刻を使った競合回避、IndexedDBの導入を検討。

2. **Supabase SDKの配信**
   - 現状はjsDelivrからES moduleをdynamic importする。
   - 完全なオフライン初回起動や供給網管理を重視するなら、Vite/npm構成に移してbundleする。

3. **PWAアイコン**
   - 現状はSVGのみ。
   - iOS向け`apple-touch-icon`と192px/512px PNGを追加推奨。

4. **ブラウザE2Eテスト**
   - JavaScript構文と静的配信は検証済みだが、Playwright等によるE2Eは未導入。
   - 公開前に主要フローの自動テストを追加推奨。

5. **日付・タイムゾーン**
   - 日付は`date`として保存し、日本語表示する。
   - タイムゾーン変換を挟まず、日付のみとして扱うこと。

6. **CSV入出力**
   - 基本リストの画面編集は実装済み。
   - CSVインポート／エクスポートはまだ未実装。バックアップ用途として追加候補。

7. **初期デモデータ**
   - Supabase未設定時はニューヨーク旅行のデモデータをlocalStorageへ作成。
   - Supabaseに初回ログインしクラウドが空の場合、基本リストだけを作成し、架空の旅行は作らない。

## 9. 重要なUX判断

- 編集ボタンを大きく目立たせない。各旅行行の右端に`•••`を置く
- `•••`は44px程度のタップ領域を確保する
- チェック画面に旅行一覧・新規作成ボタンを置かない
- 旅行一覧は独立画面とし、各旅行行からチェック画面へ入る
- 新規作成は旅行一覧の中に置く
- 画面はシンプルすぎないが、派手にしない
- Calm Modernの穏やかなグリーン、クリーム色、余白、角丸を維持する

## 10. 完了条件

- `masahirokby/packing-list`の`main`にコードがpushされている
- GitHub Pagesが公開されている
- GitHubログインが成功する
- Supabase RLSが有効で、未ログインユーザーや別ユーザーがデータを読めない
- PCとスマートフォンでチェック状態が同期する
- オフライン時もチェック操作ができ、復帰後に安全に同期する
- 基本リストの変更にコード修正が不要
- ユーザーが最終UIと実機動作を確認済み

