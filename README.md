# Next.js Development Template

個人開発用の Next.js テンプレートリポジトリです。AI開発ツール（Claude Code + Serena MCP）が事前設定済みで、すぐに開発を始められます。

## 🚀 特徴

- **Next.js 15.4.4** - App Router 使用
- **TypeScript 5.5.3** - 型安全な開発
- **Tailwind CSS 4.1.11** - ユーティリティファーストCSS
- **ESLint + Prettier** - コード品質管理
- **AI開発ツール設定済み**
  - Claude Code 設定
  - Serena MCP 設定
  - 自動フォーマット対応

## 📦 Tech Stack

### Core

- Next.js (App Router)
- React 18.3.1
- TypeScript

### Styling

- Tailwind CSS 4.1.11
- PostCSS

### Development Tools

- ESLint (Next.js config)
- Prettier
- Lucide React (icons)

### AI Tools

- Claude Code with MCP integration
- Serena for semantic code operations
- GitHub integration ready

## 🛠️ Setup

### 1. Clone & Install

```bash
# リポジトリをクローン
git clone <repository-url> <project-name>
cd <project-name>

# 依存関係インストール
npm install
```

### 2. Development

```bash
# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:3000 を開く
```

### 3. Code Quality

```bash
# コード整形
npm run format

# リンター実行
npm run lint

# ビルド確認
npm run build
```

## 📁 Project Structure

```
├── .claude/                 # Claude Code 設定
│   ├── CLAUDE.md           # プロジェクトコンテキスト
│   ├── commands/           # カスタムコマンド
│   └── settings.json       # Claude 設定
├── .serena/                # Serena MCP 設定
│   ├── memories/           # プロジェクト知識
│   └── project.yml         # Serena プロジェクト設定
├── src/
│   ├── app/
│   │   ├── layout.tsx      # ルートレイアウト
│   │   ├── page.tsx        # ホームページ
│   │   └── globals.css     # グローバルスタイル
│   └── components/         # コンポーネント
├── public/                 # 静的ファイル
├── next.config.ts          # Next.js 設定
├── tsconfig.json           # TypeScript 設定
├── eslint.config.js        # ESLint 設定
├── .prettierrc.json        # Prettier 設定
├── postcss.config.js       # PostCSS 設定
└── package.json            # 依存関係
```

## 🤖 AI Development Tools

### Claude Code

- 自動フォーマット（停止時）
- GitHub 統合
- Serena MCP 連携

### Serena MCP

- セマンティックコード操作
- プロジェクト記憶機能
- TypeScript サポート

### 設定済み機能

- 停止時自動フォーマット
- プロジェクト固有のメモリ
- コード品質チェック

## 📝 Development Workflow

1. **機能開発**

   ```bash
   npm run dev  # 開発開始
   ```

2. **コード品質確認**

   ```bash
   npm run format  # 自動整形
   npm run lint    # 品質チェック
   ```

3. **ビルド確認**
   ```bash
   npm run build   # 本番ビルド
   ```

## 🎨 Customization

### カラーテーマ

`src/app/globals.css` でTailwind テーマをカスタマイズ

### コンポーネント

`src/components/` にReactコンポーネントを追加

### AI設定

- `.claude/CLAUDE.md` - プロジェクト固有のルール
- `.serena/memories/` - プロジェクト知識の追加

## 🚢 Deployment

### Vercel (推奨)

```bash
# Vercel CLI
npm i -g vercel
vercel
```

### Static Export

```bash
npm run build
# out/ ディレクトリを任意のホスティングにデプロイ
```

## 🔧 Available Scripts

| Script                 | Description          |
| ---------------------- | -------------------- |
| `npm run dev`          | 開発サーバー起動     |
| `npm run build`        | 本番ビルド           |
| `npm start`            | 本番サーバー起動     |
| `npm run lint`         | ESLint 実行          |
| `npm run format`       | Prettier 実行        |
| `npm run format:check` | フォーマットチェック |

## 📚 References

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Serena MCP](https://github.com/oraios/serena)

## 📄 License

MIT License - 個人・商用利用可能
