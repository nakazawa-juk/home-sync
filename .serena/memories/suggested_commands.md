# 推奨開発コマンド

## Frontend (Next.js) コマンド

### 基本コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクション起動
npm start

# リンター実行
npm run lint

# フォーマット実行
npm run format

# フォーマットチェック
npm run format:check

# 型チェック
npm run typecheck
```

### コード品質チェック（実行必須）

```bash
# コード実装後は必ず以下を実行
npm run lint
npm run typecheck
npm run format:check
```

### 依存関係管理

```bash
# パッケージインストール
npm install

# パッケージ追加
npm install [package-name]

# 開発用パッケージ追加
npm install -D [package-name]

# パッケージ更新
npm update
```

## Backend (Python/FastAPI) コマンド

### 環境セットアップ

```bash
# 仮想環境作成
python -m venv venv

# 仮想環境有効化 (Mac/Linux)
source venv/bin/activate

# 仮想環境有効化 (Windows)
venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt
```

### 開発コマンド

```bash
# FastAPI開発サーバー起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# テスト実行
pytest

# コードフォーマット
black .
ruff check --fix .

# 型チェック
mypy .
```

## Supabase コマンド

### CLIコマンド

```bash
# Supabase CLI インストール
brew install supabase/tap/supabase

# プロジェクトリンク
supabase link --project-ref [project-id]

# マイグレーション作成
supabase migration new [migration_name]

# マイグレーション実行
supabase db push

# データベースリセット
supabase db reset

# 型生成
supabase gen types typescript --project-id [project-id] > lib/database.types.ts
```

## Git コマンド

### 基本操作

```bash
# ステータス確認
git status

# 変更を追加
git add .

# コミット
git commit -m "feat: 機能説明"

# プッシュ
git push origin [branch-name]

# ブランチ作成・切り替え
git checkout -b [branch-name]

# マージ
git merge [branch-name]
```

## デバッグコマンド

### ログ確認

```bash
# Next.jsログ確認
tail -f .next/server/app-paths/*

# Dockerログ確認
docker logs -f [container-name]

# ポート使用状況確認
lsof -i :3000
lsof -i :8000
```

## 便利なエイリアス設定

```bash
# ~/.zshrc or ~/.bashrc に追加
alias nrd="npm run dev"
alias nrb="npm run build"
alias nrl="npm run lint"
alias nrf="npm run format"

alias pya="source venv/bin/activate"
alias pyd="deactivate"
alias pyr="pip install -r requirements.txt"
alias pyf="uvicorn app.main:app --reload"
```
