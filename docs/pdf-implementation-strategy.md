# HomeSync PDF 実装戦略

## 🎯 実装方針

### 1. フォント対応

```python
# backend/app/services/pdf_service.py
FONT_CONFIG = {
    "japanese": [
        "/app/fonts/NotoSansCJK-Regular.ttc",  # Docker内
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux
        "Arial Unicode MS"  # フォールバック
    ]
}

def get_available_font():
    for font_path in FONT_CONFIG["japanese"]:
        if os.path.exists(font_path):
            return font_path
    return None  # システムデフォルト使用
```

### 2. PDF 出力（メモリレスポンス）

```python
@app.post("/export-pdf/{schedule_id}")
async def export_pdf(schedule_id: str) -> Response:
    try:
        # データ取得
        schedule_data = await get_schedule_for_pdf(schedule_id)

        # PDF生成（メモリ上）
        pdf_bytes = generate_schedule_pdf(schedule_data)

        # 直接レスポンス
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=schedule_{schedule_id}.pdf"
            }
        )
    except ScheduleNotFoundError:
        raise HTTPException(status_code=404, detail="Schedule not found")
```

### 3. データ取得（効率的 JOIN）

```python
async def get_schedule_for_pdf(schedule_id: str) -> PDFScheduleData:
    """PDF生成用のスケジュールデータ取得"""

    result = supabase.table("project_schedules")\
        .select("""
            id,
            version,
            project:projects!inner(
                project_number,
                project_name,
                construction_location,
                construction_company
            ),
            schedule_items!inner(
                process_name,
                planned_start_date,
                planned_end_date,
                actual_start_date,
                actual_end_date,
                assignee,
                status,
                remarks,
                order_index
            )
        """)\
        .eq("id", schedule_id)\
        .order("schedule_items.order_index")\
        .execute()

    if not result.data:
        raise ScheduleNotFoundError(f"Schedule {schedule_id} not found")

    return transform_to_pdf_data(result.data[0])
```

## 🐳 Docker 設定

### Dockerfile

```dockerfile
FROM python:3.11-slim

# 日本語フォントインストール
RUN apt-get update && apt-get install -y \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# フォントディレクトリ作成
RUN mkdir -p /app/fonts
COPY fonts/NotoSansCJK-Regular.ttc /app/fonts/

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 セキュリティ考慮事項

### 1. 入力検証

```python
from pydantic import BaseModel, UUID4

class PDFExportRequest(BaseModel):
    schedule_id: UUID4  # UUID検証

@app.post("/export-pdf/{schedule_id}")
async def export_pdf(schedule_id: UUID4):  # 型安全
    # ...
```

### 2. アクセス制御

```python
@app.post("/export-pdf/{schedule_id}")
async def export_pdf(
    schedule_id: UUID4,
    current_user: User = Depends(get_current_user)  # 認証必須
):
    # ユーザーアクセス権限確認
    if not await has_project_access(current_user.id, schedule_id):
        raise HTTPException(status_code=403, detail="Access denied")
```

## 📊 パフォーマンス最適化

### 1. キャッシュ戦略

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_font_path() -> str:
    """フォントパスキャッシュ"""
    return find_available_font()

# PDF生成はキャッシュしない（データが動的）
```

### 2. 非同期処理

```python
import asyncio

async def generate_pdf_async(schedule_data: PDFScheduleData) -> bytes:
    """非同期でPDF生成（CPU集約タスク）"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        generate_schedule_pdf_sync,
        schedule_data
    )
```

## 🧪 テスト戦略

### 1. 単体テスト

```python
def test_pdf_generation():
    sample_data = create_sample_schedule_data()
    pdf_bytes = generate_schedule_pdf(sample_data)

    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b'%PDF')

def test_font_detection():
    font_path = get_available_font()
    assert font_path is not None
```

### 2. 統合テスト

```python
async def test_pdf_export_endpoint():
    response = await client.post(f"/export-pdf/{test_schedule_id}")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
```

## 🚀 デプロイ考慮事項

### Railway/Render 対応

- **メモリ制限**: PDF 生成をメモリ効率的に
- **起動時間**: フォント初期化の最適化
- **ログ出力**: PDF 生成状況の監視

### 環境変数

```bash
# .env
PDF_FONT_PATH=/app/fonts/NotoSansCJK-Regular.ttc
PDF_MAX_SIZE_MB=10
PDF_TIMEOUT_SECONDS=30
```
