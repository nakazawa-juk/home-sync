# 開発Tips・備忘録

HomeSync開発時によく忘れがちな操作や設定の備忘録

## 🤖 AI開発ツール関連

### Serena MCP

```bash
# 【重要】開発開始時に必ず実行
/mcp__serena__initial_instructions

# プロジェクト記憶の更新
/mcp__serena__write_memory [key] [value]

# 記憶した内容の確認
/mcp__serena__read_memory [key]
```

### Claude Code

```bash
# エージェント一覧確認
/agents

# 特定エージェントの起動
/task [agent-name] [task-description]

# プロジェクト設定確認
cat CLAUDE.md
```

## 📦 パッケージ管理

### Next.js プロジェクト

```bash
# 開発サーバー起動
npm run dev

# 依存関係インストール
npm install

# コード品質チェック
npm run lint
npm run format

# ビルド確認
npm run build
```

### Python 環境（PDF Service用）

```bash
# 仮想環境作成・有効化
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# 依存関係インストール
pip install -r requirements.txt

# 開発サーバー起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 依存関係更新
pip freeze > requirements.txt
```

## 🔧 開発環境セットアップ

### 環境変数

```bash
# .env.local ファイル作成
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PDF_SERVICE_URL=http://localhost:8000
```

## 🐛 よくあるエラーと対処法

### Next.js関連

```bash
# キャッシュクリア
rm -rf .next
npm run build

# node_modules再インストール
rm -rf node_modules package-lock.json
npm install

# TypeScriptエラー確認
npx tsc --noEmit
```

### Python関連

```bash
# モジュールが見つからない
pip list  # インストール済み確認
pip install -r requirements.txt

# ポート競合
lsof -i :8000  # ポート使用確認
kill -9 [PID]  # プロセス終了
```

### Supabase関連

```bash
# 接続テスト
curl -X GET \
  -H "apikey: YOUR_ANON_KEY" \
  "YOUR_SUPABASE_URL/rest/v1/projects"

# RLS（Row Level Security）無効化（開発時のみ）
# → Supabase Dashboard > Authentication > Settings
```

### MCP環境変数

`.mcp.json`の環境変数は`~/.zshrc`を参照（`.env`や`.env.local`は無効）

```bash
# ~/.zshrc に追加
export SUPABASE_ACCESS_TOKEN="your_token"
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token"
```

## 📚 ドキュメント更新

### 新機能追加時

- CLAUDE.md更新
- docs/ にタスク追加
- agents でタスク実行

## 🏗️ プロジェクト固有の注意点

### HomeSync特有の設定

- PDF処理は必ずFastAPIサービス経由
- 工程表データは必ずバージョン管理
- 性能目標：PDF処理5秒以内、画面表示3秒以内

### 開発優先度

1. Phase 1: PDF Import + Web表示
2. Phase 2: Web編集 + PDF出力
3. Phase 3: 新規作成 + 権限管理

---

**更新日**: 2025-08-03  
**注意**: 新しいTipsを発見したら随時このファイルに追加する
