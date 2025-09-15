# 技術スタックとアーキテクチャ

## システムアーキテクチャ

ハイブリッドアーキテクチャ構成を採用

### 構成要素

1. **Next.js Application (Frontend + Backend)**
   - UI/UX (React Components)
   - Server Actions (CRUD操作)
   - 認証・セッション管理
   - ビジネスロジック
   - 直接Supabase接続

2. **PDF Service (FastAPI)**
   - PDF読み込み
   - PDF生成
   - 表データ抽出
   - PyMuPDF処理

3. **Supabase (Database)**
   - PostgreSQL
   - リアルタイムサブスクリプション
   - Row Level Security

## 技術スタック詳細

### Frontend (Next.js)

- **Language**: TypeScript
- **Framework**: Next.js 14+ (App Router)
- **Architecture**: React Server Components + Server Actions
- **UI Library**: Tailwind CSS v4
- **Database Client**: Supabase JavaScript Client
- **Deploy**: Vercel
- **MCP Tools**: GitHub, IDE, Context7, Supabase, Playwright

### Backend (PDF Service)

- **Language**: Python 3.11+
- **Framework**: FastAPI 0.104+
- **PDF Processing**: PyMuPDF (fitz) 1.23+
- **Database Client**: Supabase Python Client
- **Deploy**: Railway / Render

### Database

- **Service**: Supabase (PostgreSQL)
- **Features**: Real-time subscriptions, Row Level Security

## データフロー

1. **通常のCRUD操作**: User → React Component → Server Action → Supabase
2. **PDF処理**: User → Next.js → PDF Service (FastAPI) → Supabase

## 環境設定

### MCP (Model Context Protocol) 設定

- GitHub連携: リポジトリ管理、PR作成
- IDE連携: VS Code診断、コード実行
- Context7: ライブラリドキュメント取得
- Supabase連携: データベース操作
- Playwright: ブラウザ自動化テスト

## ディレクトリ構造

```
app/
├── page.tsx                    # ホーム画面
├── projects/
│   ├── page.tsx               # プロジェクト一覧
│   └── [id]/
│       └── page.tsx           # プロジェクト詳細
├── actions/
│   ├── projects.ts            # Server Actions
│   └── schedules.ts
├── components/
│   ├── ui/
│   ├── forms/
│   └── schedules/
└── lib/
    ├── supabase/
    ├── types.ts
    └── utils.ts
```
