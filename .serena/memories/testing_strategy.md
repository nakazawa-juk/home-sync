# テスト戦略

## テスト方針

- **MVP段階**: 手動テスト中心で迅速な機能実装を優先
- **Phase 2以降**: 自動テスト導入による品質保証

## Frontend (Next.js) テスト

### 手動テスト項目

1. **画面表示確認**
   - プロジェクト一覧の表示
   - 詳細画面の遷移
   - レスポンシブデザイン

2. **機能動作確認**
   - CRUD操作の動作
   - フィルタリング・ソート
   - エラーハンドリング

### 将来の自動テスト計画

```typescript
// Jest + React Testing Library
describe('ProjectList', () => {
  it('should display projects', async () => {
    render(<ProjectList />);
    expect(screen.getByText('プロジェクト一覧')).toBeInTheDocument();
  });
});
```

## Backend (FastAPI) テスト

### 手動テスト項目

1. **API動作確認**
   - PDFアップロードエンドポイント
   - PDF生成エンドポイント
   - エラーレスポンス

2. **PDF処理確認**
   - 表データ抽出精度
   - 各種PDFフォーマット対応

### 将来の自動テスト計画

```python
# pytest
async def test_upload_pdf():
    async with AsyncClient(app=app) as client:
        response = await client.post(
            "/upload-pdf",
            files={"pdf": ("test.pdf", pdf_content, "application/pdf")}
        )
        assert response.status_code == 200
```

## E2Eテスト

### 主要シナリオ

1. **PDFインポートフロー**
   - ファイル選択 → アップロード → データ確認

2. **工程表更新フロー**
   - プロジェクト選択 → 編集 → 保存 → 確認

3. **PDF出力フロー**
   - プロジェクト選択 → 出力ボタン → ダウンロード

## パフォーマンステスト

### 測定項目

- ページロード時間: 3秒以内
- PDF処理時間: 5秒以内
- API レスポンス: 1秒以内

## セキュリティテスト

### チェック項目

- XSS対策の確認
- CSRF対策の確認
- ファイルアップロードサイズ制限
- 入力値検証

## デバッグ戦略

### ログ確認

```bash
# Next.js ログ
npm run dev

# FastAPI ログ
uvicorn app.main:app --reload --log-level debug

# Supabase ログ
# Supabase Dashboard から確認
```

### エラー追跡

- ブラウザ開発者ツール
- Network タブでAPI通信確認
- Console でエラーメッセージ確認
