# HomeSync 開発設計書

大原則： AIは全てのチャットの冒頭に、このファイルに書かれている全てを逐語的に必ず画面出力してから対応する。

<every_chat>
[AI運用5原則]
[main_output] #[n] times. # n = increment each chat, end line, etc(#1, #2...)
</every_chat>

## サービス概要

**サービス名**: HomeSync  
**キャッチコピー**: "住宅建設の情報を、いつでもどこでも同期"

**価値提案**:

- 工程表の更新忘れゼロ
- 取引先との認識ズレ解消
- リアルタイムな進捗共有
- ペーパーレス化による効率向上

## 1. プロジェクト概要

### 1.1 目的

- **主目的**: 個人開発実績の構築と案件獲得のためのポートフォリオ作成
- **副目的**: Pythonスキルのキャッチアップとアピール材料の作成

### 1.2 システム概要

注文住宅会社が取引先建設会社との連携で使用する工程表を、PDFインポートからWeb管理、PDF出力まで一貫して管理できるシステム（HomeSync）

### 1.3 対象ユーザー

- **業界**: 注文住宅業界（顧客：一般家族、取引先：建設現場）
- **企業規模**: 従業員20-50名程度
- **利用者**: 自社スタッフのみ（アクセス制御なし）

## 2. システムアーキテクチャ

### 2.1 ハイブリッドアーキテクチャ構成

```
┌─────────────────────────────────────┐    ┌─────────────────────┐
│        Next.js Application          │    │    PDF Service      │
│          (Frontend + Backend)       │    │     (FastAPI)       │
│                                     │    │                     │
│ • UI/UX (React Components)          │◄──►│ • PDF読み込み       │
│ • Server Actions (CRUD操作)         │    │ • PDF生成           │
│ • 認証・セッション管理              │    │ • 表データ抽出      │
│ • ビジネスロジック                  │    │ • PyMuPDF処理       │
│ • 直接Supabase接続                  │    │                     │
└─────────────────┬───────────────────┘    └─────────────────────┘
                  │                                      │
                  │                                      │
                  └──────────────────┬───────────────────┘
                                     │
                              ┌─────────────┐
                              │  Supabase   │
                              │ (PostgreSQL)│
                              └─────────────┘
```

**役割分担**:

- **Next.js**: 全UI + 通常のCRUD操作 + 認証
- **FastAPI**: PDF処理専用サービス
- **Supabase**: データベース + 認証基盤

### 2.2 技術スタック

#### **Next.js Application (Frontend + Backend)**

- **Language**: TypeScript
- **Framework**: Next.js 14+ (App Router)
- **Architecture**: React Server Components + Server Actions
- **UI Library**: Tailwind CSS v4
- **Database Client**: Supabase JavaScript Client (直接接続)
- **Deploy**: Vercel
- **役割**: UI/UX + 通常のCRUD操作 + 認証

#### **PDF Service (専用マイクロサービス)**

- **Language**: Python 3.11+
- **Framework**: FastAPI 0.104+
- **PDF Processing**: PyMuPDF (fitz) 1.23+
- **Database Client**: Supabase Python Client
- **Deploy**: Railway / Render
- **役割**: PDF処理専用（アップロード解析・生成出力のみ）

#### **Database**

- **Service**: Supabase (PostgreSQL)
- **Features**: Real-time subscriptions, Row Level Security

## 3. データフロー設計

### 3.1 通常の CRUD 操作（Next.js → Supabase 直接アクセス）

```
User Action → React Component → Server Action → Supabase → Response
```

**例: プロジェクト一覧取得**

```typescript
// app/actions/projects.ts
"use server";

export async function getProjects() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

// app/projects/page.tsx
export default async function ProjectsPage() {
  const { data: projects } = await getProjects();
  return <ProjectList projects={projects} />;
}
```

**このパターンで処理される操作**:

- プロジェクト情報の取得・作成・更新・削除
- 工程表データの参照・更新
- ユーザー認証・セッション管理
- 一般的なビジネスロジック

### 3.2 PDF 処理（FastAPI 専用サービス経由）

```
User Upload → Next.js Frontend → PDF Service (FastAPI) → Supabase → Response
```

**フロー詳細**:

1. ユーザーが PDF ファイルを選択
2. Next.js が FormData として PDF Service に送信
3. Python FastAPI が PyMuPDF で表データ抽出
4. 抽出データを Supabase に保存
5. 結果を Next.js に返却

**このパターンで処理される操作**:

- PDFファイルのアップロード・解析
- 工程表PDFの生成・出力
- PDF関連の専門処理

## 4. データベース設計

### 4.1 テーブル構造

#### **projects テーブル（プロジェクトマスタ）**

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_number SERIAL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    construction_location TEXT,
    construction_company VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **project_schedules テーブル（工程表履歴）**

```sql
CREATE TABLE project_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **schedule_items テーブル（工程詳細）**

```sql
CREATE TABLE schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES project_schedules(id) ON DELETE CASCADE,
    process_name VARCHAR(255) NOT NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    status VARCHAR(50) CHECK (status IN ('未着手', '進行中', '完了', '遅延', '中断')),
    assignee VARCHAR(255),
    remarks TEXT,
    order_index INTEGER DEFAULT 0
);
```

### 4.2 工程表項目定義

#### 4.2.1 基本情報

- **プロジェクトID**: システム内部識別子（UUID）
- **プロジェクト番号**: 画面表示用連番
- **プロジェクト名**: 顧客名や案件名（例：「田中様邸新築工事」）
- **工事場所**: 建設地住所
- **施工会社名**: 取引先建設会社

#### 4.2.2 工程管理項目

- **工程名**: 作業工程（地盤調査、基礎工事、上棟、屋根工事、外壁工事、内装工事、竣工検査等）
- **開始予定日**: 各工程の着手予定日
- **終了予定日**: 各工程の完了予定日
- **実際開始日**: 実際の着手日
- **実際終了日**: 実際の完了日
- **進捗ステータス**: 未着手/進行中/完了/遅延/中断
- **担当者**: 各工程の責任者名
- **備考**: 特記事項や注意点

## 5. 機能要件

### 5.1 必須機能（優先度：高）

#### 5.1.1 PDFインポート機能

- **概要**: 工程表PDFファイルをアップロードし、データを自動抽出
- **対象PDF**: 電子データのみ（手書きスキャン対象外）
- **形式**: 表形式のレイアウト
- **制約**: 1PDF = 1工程表

**処理フロー**:

1. PDFファイルアップロード
2. PyMuPDFによる表構造の自動検出・データ抽出
3. プロジェクトID存在チェック
4. 新規/更新判定
5. データベース保存

#### 5.1.2 データベース保存機能

- **概要**: 抽出したデータをリレーショナルデータベースに構造化して保存
- **履歴管理**: 更新時は新バージョンとして保存（過去履歴保持）

#### 5.1.3 Web参照機能

- **概要**: ブラウザ上でプロジェクト一覧・詳細を表示
- **一覧機能**:
  - 無限スクロール（初期20件、スクロール時追加20-30件ロード）
  - フィルタリング（日付、場所、会社名、担当者、進捗ステータス）
  - 並び替え機能
- **詳細機能**: 個別プロジェクトの工程表表示

### 5.2 推奨機能（優先度：中）

#### 5.2.1 Web更新機能

- **概要**: ブラウザ上で工程表データを編集
- **更新反映**: リアルタイムでデータベース更新

#### 5.2.2 PDF出力機能

- **概要**: 更新されたデータからPyMuPDFを使用して新しいPDFを生成
- **フォーマット**: システム固定フォーマット（インポート元に依存せず）
- **活用**: 取引先との情報共有

### 5.3 将来機能（優先度：低）

- 新規工程表作成機能
- CSVエクスポート機能
- ユーザー権限管理
- 取引先別アクセス制御

## 6. API 設計

### 6.1 Next.js Server Actions

```typescript
// app/actions/schedules.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateScheduleItem(
  itemId: string,
  data: UpdateScheduleData,
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('schedule_items')
    .update(data)
    .eq('id', itemId);

  if (error) throw error;

  revalidatePath('/projects/[id]', 'page');
  return { success: true };
}

export async function createProject(formData: FormData) {
  const supabase = createClient();

  const projectData = {
    project_name: formData.get('project_name') as string,
    construction_location: formData.get('location') as string,
    construction_company: formData.get('company') as string,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/projects');
  return data;
}
```

### 6.2 PDF Service API (FastAPI)

```python
# main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import json
from supabase import create_client, Client

app = FastAPI(title="HomeSync PDF Service")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-nextjs-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-pdf")
async def upload_pdf(
    pdf: UploadFile = File(...),
    project_id: str = Form(...)
):
    """PDF工程表のアップロードと解析"""

    if pdf.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="PDFファイルのみ対応")

    try:
        # PDFデータを読み込み
        content = await pdf.read()
        doc = fitz.open(stream=content, filetype="pdf")

        # 表データ抽出
        schedule_data = extract_schedule_data(doc)

        # Supabaseに保存
        result = save_schedule_to_database(schedule_data, project_id)

        doc.close()
        return {"status": "success", "schedule_id": result["id"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export-pdf/{schedule_id}")
async def export_pdf(schedule_id: str):
    """工程表のPDF出力"""

    try:
        # データベースから工程表データ取得
        schedule_data = get_schedule_from_database(schedule_id)

        # PyMuPDFでPDF生成
        pdf_content = generate_schedule_pdf(schedule_data)

        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=schedule_{schedule_id}.pdf"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def extract_schedule_data(doc: fitz.Document) -> list:
    """PyMuPDFを使用して工程表データを抽出"""
    page = doc[0]  # 最初のページ
    tables = page.find_tables()

    schedule_items = []
    for table in tables:
        table_data = table.extract()
        # テーブルデータを構造化
        for row in table_data[1:]:  # ヘッダー行をスキップ
            if len(row) >= 5:  # 必要な列数をチェック
                schedule_items.append({
                    "process_name": row[0],
                    "planned_start_date": parse_date(row[1]),
                    "planned_end_date": parse_date(row[2]),
                    "assignee": row[3],
                    "status": row[4] or "未着手"
                })

    return schedule_items
```

#### 6.2.1 PDF Service API設計

PDF処理専用のAPIエンドポイント設計（データCRUD操作はNext.js Server Actionsで直接Supabaseアクセス）:

```python
# PDF処理専用API（FastAPI）
POST /upload-pdf                 # PDFアップロード・解析
POST /export-pdf/{schedule_id}   # PDF生成・出力
GET /health                      # ヘルスチェック

# 通常のデータ操作（Next.js Server Actions経由でSupabase直接アクセス）
# - プロジェクト一覧取得・作成・更新・削除
# - 工程表データの参照・更新
# - ユーザー管理・認証
```

## 7. コンポーネント設計

### 7.1 ページ構成

```
app/
├── page.tsx                    # ホーム画面
├── projects/
│   ├── page.tsx               # プロジェクト一覧
│   ├── new/page.tsx           # 新規プロジェクト作成
│   └── [id]/
│       ├── page.tsx           # プロジェクト詳細
│       ├── edit/page.tsx      # 工程表編集
│       └── upload/page.tsx    # PDF アップロード
├── actions/
│   ├── projects.ts            # プロジェクト関連Server Actions
│   └── schedules.ts           # 工程表関連Server Actions
├── components/
│   ├── ui/                    # 再利用可能UIコンポーネント
│   ├── forms/                 # フォーム関連コンポーネント
│   └── schedules/             # 工程表関連コンポーネント
└── lib/
    ├── supabase/              # Supabase設定
    ├── types.ts               # 型定義
    └── utils.ts               # ユーティリティ関数
```

### 7.2 重要コンポーネント例

```typescript
// components/schedules/ScheduleTable.tsx
"use client";

import { updateScheduleItem } from "@/app/actions/schedules";
import { ScheduleItem } from "@/lib/types";

interface Props {
  scheduleItems: ScheduleItem[];
  projectId: string;
}

export function ScheduleTable({ scheduleItems, projectId }: Props) {
  const handleStatusUpdate = async (itemId: string, status: string) => {
    await updateScheduleItem(itemId, { status });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">工程名</th>
            <th className="px-4 py-2 text-left">開始予定</th>
            <th className="px-4 py-2 text-left">終了予定</th>
            <th className="px-4 py-2 text-left">担当者</th>
            <th className="px-4 py-2 text-left">ステータス</th>
            <th className="px-4 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {scheduleItems.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="px-4 py-2">{item.process_name}</td>
              <td className="px-4 py-2">{item.planned_start_date}</td>
              <td className="px-4 py-2">{item.planned_end_date}</td>
              <td className="px-4 py-2">{item.assignee}</td>
              <td className="px-4 py-2">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-2">
                <StatusUpdateButton
                  currentStatus={item.status}
                  onUpdate={(status) => handleStatusUpdate(item.id, status)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 8. 画面設計

### 8.1 画面一覧

1. **プロジェクト一覧画面**: メイン画面
2. **プロジェクト詳細画面**: 工程表詳細表示・編集
3. **PDFインポート画面**: ファイルアップロード
4. **PDF出力画面**: エクスポート機能

### 8.2 画面仕様

#### 8.2.1 プロジェクト一覧画面

- **表示項目**: プロジェクト番号、プロジェクト名、工事場所、施工会社、進捗状況、最終更新日
- **機能**:
  - 無限スクロール
  - フィルタリング（日付範囲、場所、会社名、担当者、ステータス）
  - 並び替え（作成日、更新日、プロジェクト番号）
  - 詳細画面への遷移

#### 8.2.2 プロジェクト詳細画面

- **表示項目**: 全工程の詳細情報をテーブル形式で表示
- **機能**:
  - インライン編集
  - バージョン履歴表示
  - PDF出力ボタン

## 9. フロントエンド開発ルール

### 9.1 技術スタック詳細

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **UI**: React 18.3.1
- **スタイリング**: Tailwind CSS v4
- **アイコン**: Lucide React
- **画像最適化**: Next.js Image component
- **コードフォーマット**: Prettier
- **リンター**: ESLint

### 9.2 コーディング原則

- **可読性重視**: 明確な変数名・関数名
- **型安全**: TypeScript活用、any型禁止
- **パフォーマンス**: 不要な再レンダリング回避
- **保守性**: 単一責任原則、DRY原則遵守
- **セキュリティ**: XSS対策、適切なサニタイゼーション

### 9.3 スタイリング規約

- **Tailwind CSS**: ユーティリティクラス活用
- **レスポンシブ**: `sm:`, `md:`, `lg:` プレフィックス使用
- **アニメーション**: `transition-*`, `hover:*` クラス活用
- **カスタムCSS**: globals.cssでキーフレーム定義

### 9.4 パフォーマンス最適化

#### React Server Componentsで最適化

```typescript
export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  // サーバーサイドでデータ取得（0ラウンドトリップ）
  const project = await getProject(params.id);
  const schedules = await getSchedules(params.id);

  return (
    <div>
      <ProjectHeader project={project} />
      <Suspense fallback={<ScheduleTableSkeleton />}>
        <ScheduleTable schedules={schedules} />
      </Suspense>
    </div>
  );
}
```

## 10. Python/FastAPIバックエンド開発ルール

### 10.1 技術スタック詳細

- **Python**: 3.11+
- **Framework**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+
- **DB Migration**: Alembic
- **PDF Processing**: PyMuPDF 1.23+
- **Data Validation**: Pydantic 2.0+
- **Testing**: pytest, pytest-asyncio
- **Linting**: ruff, black
- **Type Checking**: mypy

### 10.2 プロジェクト構造

```
backend/
├── app/
│   ├── main.py (FastAPIアプリケーション)
│   ├── config.py (設定管理)
│   ├── database.py (DB接続・セッション管理)
│   ├── models/ (SQLAlchemyモデル)
│   ├── schemas/ (Pydanticスキーマ)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py (依存性注入)
│   │   └── v1/ (APIエンドポイント)
│   ├── services/ (ビジネスロジック)
│   ├── utils/ (ユーティリティ関数)
│   └── tests/
├── alembic/ (マイグレーション)
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

### 10.3 コーディング規約

#### 1. 型アノテーション

```python
# 必須：すべての関数・メソッドに型アノテーションを記述
def process_pdf(file_path: str) -> dict[str, Any]:
    pass

# クラス属性にも型アノテーションを記述
class ProjectService:
    db: Session
    logger: logging.Logger
```

#### 2. エラーハンドリング

```python
# カスタム例外クラスを定義
class PDFProcessingError(Exception):
    """PDF処理エラー"""
    pass

class ProjectNotFoundError(Exception):
    """プロジェクト未発見エラー"""
    pass

# 適切なエラーハンドリングとログ出力
try:
    result = process_pdf(file_path)
except PDFProcessingError as e:
    logger.error(f"PDF処理エラー: {e}")
    raise HTTPException(status_code=400, detail="PDFファイルを処理できませんでした")
```

#### 3. Pydanticスキーマ設計

```python
from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional

class ProjectCreateSchema(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=255)
    construction_location: Optional[str] = Field(None, max_length=500)
    construction_company: Optional[str] = Field(None, max_length=255)

    @validator('project_name')
    def validate_project_name(cls, v):
        if not v.strip():
            raise ValueError('プロジェクト名は必須です')
        return v.strip()

class ProjectResponseSchema(ProjectCreateSchema):
    id: str
    project_number: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

#### 4. エラーレスポンス統一

```python
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    error_code: str
    message: str
    detail: Optional[str] = None

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error_code="VALIDATION_ERROR",
            message="入力データが不正です",
            detail=str(exc)
        ).dict()
    )
```

### 10.4 セキュリティ原則

#### 1. 入力検証

```python
# Pydanticでの厳密な入力検証
class PDFUploadSchema(BaseModel):
    file_size: int = Field(..., gt=0, le=10_000_000)  # 10MB制限
    file_type: str = Field(..., regex=r'^application/pdf$')

# ファイルアップロード制御
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_pdf_file(file: UploadFile) -> None:
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDFファイルのみ許可されています")

    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="ファイルサイズが大きすぎます")
```

#### 2. API 通信セキュリティ

```python
from fastapi.security import HTTPBearer
from fastapi import Depends, HTTPException

security = HTTPBearer()

async def verify_token(token: str = Depends(security)):
    """Supabase JWTトークン検証"""
    try:
        # Supabase JWT検証ロジック
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/upload-pdf")
async def upload_pdf(
    pdf: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    # 認証されたユーザーのみPDFアップロード可能
    pass
```

### 10.5 パフォーマンス最適化

#### 1. 非同期処理とキャッシュ

```python
from functools import lru_cache
import asyncio
from concurrent.futures import ThreadPoolExecutor

# メモリキャッシュ
@lru_cache(maxsize=128)
def get_project_config(project_type: str) -> dict:
    return load_config(project_type)

# CPU集約的タスクは別スレッドで実行
async def process_pdf_async(file_path: str) -> dict:
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        result = await loop.run_in_executor(executor, extract_pdf_data, file_path)
    return result

# 非同期でPDF処理
@app.post("/upload-pdf")
async def upload_pdf_async(pdf: UploadFile = File(...)):
    """非同期でPDF処理"""
    content = await pdf.read()

    # バックグラウンドでPDF処理
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: parse_pdf_cached(hashlib.md5(content).hexdigest(), content)
    )

    return result
```

### 10.6 監視・ログ

#### 1. ヘルスチェック

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
```

#### 2. 構造化ログ

```python
import logging

# 構造化ログを使用
logger = logging.getLogger(__name__)

def process_request(project_id: str):
    logger.info("処理開始", extra={"project_id": project_id})
    try:
        # 処理
        logger.info("処理完了", extra={"project_id": project_id})
    except Exception as e:
        logger.error("処理エラー", extra={"project_id": project_id, "error": str(e)})
        raise
```

## 11. デプロイメント設計

### 11.1 Next.js Application (Vercel)

```yaml
# vercel.json
{
  'framework': 'nextjs',
  'buildCommand': 'npm run build',
  'devCommand': 'npm run dev',
  'installCommand': 'npm install',
  'env':
    {
      'NEXT_PUBLIC_SUPABASE_URL': '@supabase_url',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': '@supabase_anon_key',
      'SUPABASE_SERVICE_ROLE_KEY': '@supabase_service_key',
      'PDF_SERVICE_URL': '@pdf_service_url',
    },
}
```

### 11.2 PDF Service (Railway/Render)

```dockerfile
# Dockerfile for PDF Service
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```txt
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
PyMuPDF==1.23.14
supabase==2.0.2
python-multipart==0.0.6
python-dotenv==1.0.0
```

## 12. 非機能要件

### 12.1 性能要件

- **レスポンス時間**: 画面表示3秒以内
- **同時接続**: 10ユーザー程度
- **データ量**: プロジェクト数百件程度
- **PDF処理性能**: PyMuPDFによる高速処理

### 12.2 セキュリティ要件

- **認証**: 基本認証（初期段階）
- **データ保護**: HTTPS通信
- **アクセス制御**: 全ユーザー全データアクセス可

### 12.3 運用要件

- **バックアップ**: Supabaseの自動バックアップ機能
- **メンテナンス**: 基本的にメンテナンスフリー

## 13. システム制約

### 13.1 技術制約

- PDFフォーマットは固定（柔軟性なし）
- 手書き文字対応なし
- 電子データPDFのみ対応
- PyMuPDF の機能範囲内での PDF処理

### 13.2 運用制約

- 自社スタッフのみ利用
- 取引先は直接システム使用しない
- 権限管理は実装しない

## 14. 開発フェーズ

### 14.1 Phase 1（MVP）

- PDFインポート機能（PyMuPDF使用）
- データベース保存機能
- Web参照機能（Next.js + TypeScript）

### 14.2 Phase 2

- Web更新機能
- PDF出力機能（PyMuPDF使用）

### 14.3 Phase 3（将来）

- 新規作成機能（PyMuPDF使用）
- CSVエクスポート
- 権限管理

## 15. 開発時コマンド

### 15.1 フロントエンド（Next.js）

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

### 15.2 バックエンド（Python/FastAPI）

```bash
# 仮想環境作成・有効化
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 依存関係インストール
pip install -r requirements.txt

# 開発サーバー起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# マイグレーション実行
alembic upgrade head

# 新しいマイグレーション作成
alembic revision --autogenerate -m "マイグレーション名"

# テスト実行
pytest

# コードフォーマット
black .
ruff check --fix .

# 型チェック
mypy .

# 依存関係ファイル生成
pip freeze > requirements.txt
```

## 16. アクセシビリティ・UI/UX原則

- **アクセシビリティ**: WCAG 2.1 AA準拠
- **パフォーマンス**: 軽量・高速表示
- **直感性**: 分かりやすいナビゲーション
- **一貫性**: 統一されたデザインシステム
- **キーボード操作**: Tab遷移対応
- **スクリーンリーダー**: ARIA属性適切設定
- **色覚**: カラーコントラスト確保

## 17. 想定する建設工程

注文住宅の一般的な工程（3-6ヶ月）:

1. 地盤調査・地縄張り
2. 基礎工事
3. 上棟・構造材設置
4. 屋根・外壁工事
5. 内装工事
6. 竣工検査・引き渡し

## 18. 運用シナリオ

1. 取引先から受領した工程表PDFをHomeSyncにインポート
2. 進捗に応じてWeb画面で状況更新（情報同期）
3. 変更があった場合、更新した工程表をPDF出力
4. 出力したPDFを取引先と共有（リアルタイム情報共有）

## 19. 成功指標

### 19.1 技術的成功指標

- PDF解析精度: 95%以上（PyMuPDF使用）
- システム稼働率: 99%以上
- レスポンス時間: 目標値内
- PDF生成処理時間: 5秒以内

### 19.2 ビジネス的成功指標

- ポートフォリオとしての完成度
- Pythonスキルの実証
- 案件獲得への貢献

---

**作成日**: 2025年8月2日  
**作成者**: Jukiya  
**バージョン**: 2.1  
**サービス名**: HomeSync

このルールファイルを参照して、一貫性のある高品質な開発を行ってください。

## 開発フロー

### チケット管理

- 機能ごとにチケットを `/docs/` 配下で管理
- ファイル名：`ticket-XXX-[機能名].md` (XXXは連番)
- Todo管理：`- [ ]` (未完了) / `- [x]` (完了)

### 開発優先順位

1. **Phase 1**: Web UI実装（モックデータ使用）
2. **Phase 2**: PDF処理サービス実装
3. **Phase 3**: データベース連携実装

### 実装方針

- MVP（最小機能プロダクト）でまず動作するものを作成
- モックデータで機能確認後、実際のAPI連携
- チケット完了時は必ずチェックマークを更新

### コミットメッセージルール

- **プレフィックス必須**: `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`など
- **本文**: 日本語で端的に記述（基本1行）
- **複数変更時**: 可読性重視で複数行可

**例**:

```
feat: プロジェクト一覧画面の実装
fix: ガントチャート表示バグ修正
chore: 依存関係更新とTailwind CSS設定
docs: CLAUDE.mdにコミットルール追加
```
