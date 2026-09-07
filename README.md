# パッキングリスト 🧳

旅行・出張ごとに、スーツケース、バックパック、行先別の持ち物を管理するモバイル向けPWAです。

Claude Codeへ作業を引き継ぐ場合は、最初に [`CLAUDE_CODE_HANDOFF.md`](CLAUDE_CODE_HANDOFF.md) を読んでください。

## 主な機能

- 旅行・出張の作成、編集、削除
- 旅行ごとに独立したチェック状態
- スーツケース／バックパック／行先別の絞り込み
- 未確認項目だけを表示
- 基本の持ち物リストをアプリ内で追加・編集・使用停止
- Supabase AuthによるGitHubログイン
- Supabaseへのクラウド保存
- オフライン時の端末内保存とPWA対応

## ローカルで確認

Supabaseを設定しなくても、デモデータと端末内保存で動作します。

```bash
python -m http.server 8080
```

ブラウザで `http://localhost:8080` を開きます。

## Supabaseの設定

1. Supabase DashboardのSQL Editorで [`supabase/schema.sql`](supabase/schema.sql) を実行します。
2. Authentication > Providers > GitHubを有効にします。
3. GitHub OAuth AppのCallback URLには、Supabase画面に表示されるCallback URLを設定します。
4. Authentication > URL ConfigurationでGitHub PagesのURLを許可します。

公開用の接続情報は、GitHubリポジトリの Settings > Secrets and variables > Actions > Variables に登録します。

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

`secret`または`service_role`キーはブラウザ、GitHub Pages、ソースコードに絶対に入れないでください。

## GitHub Pages

1. リポジトリの Settings > Pages を開きます。
2. Sourceで「GitHub Actions」を選びます。
3. `main`へpushすると `.github/workflows/deploy-pages.yml` が自動公開します。

## データの扱い

旅行を作成すると、その時点の基本リストを旅行専用にコピーします。基本リストを後から変更しても、過去の旅行は変わりません。「準備中の旅行にも反映」を選んだ場合だけ、未チェックの項目へ変更を反映します。
