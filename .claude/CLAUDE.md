# Next.js開発テンプレート

## プロジェクト概要

### 技術スタック

- **フレームワーク**: Next.js 15.4.4 (App Router)
- **言語**: TypeScript 5.5.3
- **UI**: React 18.3.1
- **スタイリング**: Tailwind CSS 4.1.11
- **アイコン**: Lucide React 0.344.0
- **画像最適化**: Next.js Image component
- **コードフォーマット**: Prettier 3.6.2
- **リンター**: ESLint 9.9.1

## コーディングルール

### ファイル構成

```
src/
├── app/
│   ├── layout.tsx (メタデータ・SEO設定)
│   ├── page.tsx (メインページ)
│   └── globals.css (グローバルスタイル)
└── components/
    └── (アプリケーション固有のコンポーネント)
```

### コーディング原則

- **可読性重視**: 明確な変数名・関数名
- **型安全**: TypeScript活用、any型禁止
- **パフォーマンス**: 不要な再レンダリング回避
- **保守性**: 単一責任原則、DRY原則遵守
- **セキュリティ**: XSS対策、適切なサニタイゼーション

### スタイリング規約

- **Tailwind CSS**: ユーティリティクラス活用
- **レスポンシブ**: `sm:`, `md:`, `lg:` プレフィックス使用
- **アニメーション**: `transition-*`, `hover:*` クラス活用
- **カスタムCSS**: globals.cssでキーフレーム定義

## 開発フロー

### 開発準備

1. **環境確認**: Node.js、依存関係最新化
2. **ローカル起動**: `npm run dev`
3. **リンター実行**: `npm run lint`
4. **フォーマット**: `npm run format`

### 変更手順

1. **機能実装**: 段階的な開発
2. **動作確認**: ローカル環境でのテスト
3. **コードレビュー**: 品質チェック

### コミットルール

- **メッセージ形式**: `type: description`
- **タイプ例**: `feat:`, `fix:`, `style:`, `refactor:`
- **説明**: 変更内容を簡潔に記述
- **Co-authored-by**: Claude Code明記

## UI/UX原則

- **アクセシビリティ**: WCAG 2.1 AA準拠
- **パフォーマンス**: 軽量・高速表示
- **直感性**: 分かりやすいナビゲーション
- **一貫性**: 統一されたデザインシステム

## パフォーマンス最適化

### 目標指標

- **Lighthouse Score**: 90点以上
- **Core Web Vitals**: 良好評価
- **Page Speed**: 3秒以内の読み込み

### 最適化手法

- **画像**: Next.js Image最適化
- **バンドル**: コード分割・遅延読み込み
- **キャッシュ**: 適切なCache-Control設定

## 注意事項・制約

### ブラウザ対応

- **対象**: モダンブラウザ（Chrome, Firefox, Safari, Edge）
- **モバイル**: iOS Safari, Android Chrome

### アクセシビリティ

- **キーボード操作**: Tab遷移対応
- **スクリーンリーダー**: ARIA属性適切設定
- **色覚**: カラーコントラスト確保
- **フォントサイズ**: 拡大縮小対応

### セキュリティ

- **HTTPS**: 常時SSL化
- **外部リンク**: rel="noopener noreferrer"
- **入力値**: 適切なバリデーション

---

## 開発時の参考コマンド

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
```

このルールファイルを参照して、一貫性のある高品質な開発を行ってください。
