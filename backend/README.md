# HomeSync PDF Service

住宅建設の工程表を、PDF インポートから Web 管理、PDF 出力まで一貫して管理できるシステムの PDF 処理専用マイクロサービス

## 📋 目次

- [プロジェクト概要](#プロジェクト概要)
- [技術スタック](#技術スタック)
- [ディレクトリ構造](#ディレクトリ構造)
- [開発環境セットアップ](#開発環境セットアップ)
- [環境変数設定](#環境変数設定)
- [開発コマンド](#開発コマンド)
- [API 仕様](#api仕様)
- [開発ワークフロー](#開発ワークフロー)
- [テスト](#テスト)
- [デプロイメント](#デプロイメント)
- [トラブルシューティング](#トラブルシューティング)
- [Python 開発のベストプラクティス](#python開発のベストプラクティス)

## 🎯 プロジェクト概要

### 役割・責務

この PDF サービスは、HomeSync システムにおいて PDF 処理専用の機能を提供します：

- **PDF アップロード・解析**: PyMuPDF を使用した工程表データ抽出
- **PDF 生成・出力**: 更新されたデータからの新しい PDF 生成
- **データベース連携**: Supabase を通じたデータ永続化

### アーキテクチャにおける位置づけ

```
Next.js Application ──→ PDF Service (FastAPI) ──→ Supabase
    (通常CRUD)            (PDF処理専用)           (データベース)
```

## 🔧 技術スタック

| 技術         | バージョン | 用途                     |
| ------------ | ---------- | ------------------------ |
| **Python**   | 3.11+      | メイン言語               |
| **FastAPI**  | 0.104+     | Web フレームワーク       |
| **PyMuPDF**  | 1.23+      | PDF 処理（fitz）         |
| **Supabase** | 2.0+       | データベースクライアント |
| **Pydantic** | 2.0+       | データバリデーション     |
| **Uvicorn**  | 0.24+      | ASGI サーバー            |

### 開発ツール

| ツール     | 用途                         |
| ---------- | ---------------------------- |
| **Black**  | コードフォーマッター         |
| **Ruff**   | リンター・インポートソーター |
| **mypy**   | 型チェッカー                 |
| **pytest** | テストフレームワーク         |

## 📁 ディレクトリ構造

```
backend/
├── app/                    # メインアプリケーション
│   ├── __init__.py
│   ├── main.py            # FastAPIアプリケーションエントリーポイント
│   ├── config.py          # 設定管理（環境変数）
│   ├── database.py        # Supabaseクライアント管理
│   ├── api/               # APIエンドポイント
│   │   ├── __init__.py
│   │   └── v1/            # APIバージョン1
│   │       └── __init__.py
│   ├── schemas/           # Pydanticスキーマ（データ構造定義）
│   │   └── __init__.py
│   ├── services/          # ビジネスロジック
│   │   └── __init__.py
│   ├── utils/             # ユーティリティ関数
│   │   └── __init__.py
│   └── tests/             # テストファイル
│       └── __init__.py
├── samples/               # サンプルファイル・仕様書
│   ├── README.md          # PDF標準フォーマット仕様
│   ├── generate_sample_pdf.py
│   └── sample_schedule.pdf
├── pyproject.toml         # Python プロジェクト設定・依存関係管理
├── Dockerfile            # コンテナイメージ定義
└── README.md             # このファイル
```

### ディレクトリの役割詳細

- **`app/main.py`**: アプリケーションのエントリーポイント。FastAPI インスタンス、CORS 設定、ライフサイクル管理
- **`app/config.py`**: 環境変数を管理する設定クラス。本番・開発環境の切り替え
- **`app/database.py`**: Supabase クライアントの初期化と依存性注入の管理
- **`app/api/v1/`**: REST API エンドポイント。バージョニングされた API 設計
- **`app/schemas/`**: API の入出力データ構造を Pydantic で定義
- **`app/services/`**: PDF 処理などのビジネスロジック。コントローラーから分離
- **`app/utils/`**: 汎用的なヘルパー関数

## 🚀 開発環境セットアップ

### 前提条件

- Python 3.11 以上
- pip または poetry
- Git

### 1. リポジトリクローンと移動

```bash
git clone <repository-url>
cd home-sync/backend
```

### 2. 仮想環境作成・有効化

**仮想環境とは**: Python プロジェクトごとに独立したパッケージ環境を作る仕組み。システムの Python を汚さず、プロジェクト間の依存関係の競合を回避できます。

```bash
# 仮想環境作成
python -m venv venv

# 仮想環境有効化
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# 有効化確認（プロンプトに(venv)が表示される）
(venv) $ which python
```

### 3. 依存関係インストール

```bash
# 開発依存関係も含めてインストール（推奨）
pip install -e ".[dev]"
```

### 4. 環境変数設定

`.env`ファイルを作成し、必要な環境変数を設定：

```bash
# backend/ ディレクトリで実行
cp .env.example .env  # （もしある場合）
```

`.env`ファイルの内容例は[環境変数設定](#環境変数設定)を参照してください。

### 5. 動作確認

```bash
# 開発サーバー起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ブラウザでアクセス
# http://localhost:8000 - ルートエンドポイント
# http://localhost:8000/docs - 自動生成APIドキュメント
# http://localhost:8000/health - ヘルスチェック
```

## ⚙️ 環境変数設定

`backend/.env`ファイルを作成し、以下の変数を設定してください：

```env
# === Supabase 設定 ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx...

# === データベース 設定 ===
DATABASE_URL=postgresql://user:password@localhost/dbname

# === アプリケーション 設定 ===
DEBUG=true
LOG_LEVEL=info
SECRET_KEY=your-secret-key-here-change-in-production
ENVIRONMENT=development

# === CORS 設定 ===
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app

# === ファイルアップロード 設定 ===
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=application/pdf

# === PDF処理 設定 ===
PDF_OUTPUT_PATH=/tmp/generated_pdfs
PDF_TEMP_PATH=/tmp/uploaded_pdfs
```

### 環境変数の説明

| 変数名                      | 説明                                     | 例                           |
| --------------------------- | ---------------------------------------- | ---------------------------- |
| `SUPABASE_URL`              | Supabase プロジェクト URL                | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | サービスロールキー（管理者権限）         | `sb_secret_xxx...`           |
| `DEBUG`                     | デバッグモード（開発時は true）          | `true` / `false`             |
| `ALLOWED_ORIGINS`           | CORS 許可オリジン（カンマ区切り）        | `http://localhost:3000`      |
| `MAX_FILE_SIZE`             | アップロードファイル最大サイズ（バイト） | `10485760` (10MB)            |

## 💻 開発コマンド

### 基本操作

```bash
# === 開発サーバー起動 ===
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# === ヘルスチェック ===
curl http://localhost:8000/health

# === API ドキュメント確認 ===
# ブラウザで http://localhost:8000/docs
```

### コード品質管理

```bash
# === コードフォーマット ===
black .                    # 自動フォーマット適用
black --check .            # フォーマット確認のみ

# === リンター ===
ruff check .               # コードスタイル・エラーチェック
ruff check --fix .         # 自動修正可能な問題を修正

# === 型チェック ===
mypy .                     # 型アノテーションの検証
```

### テスト

```bash
# === 全テスト実行 ===
pytest

# === カバレッジ付きテスト ===
pytest --cov=app --cov-report=html

# === 特定テスト実行 ===
pytest app/tests/test_main.py::test_health_check
```

### 依存関係管理

```bash
# === パッケージ追加 ===
# pyproject.toml の dependencies に追加してから
pip install -e ".[dev]"   # 再インストール

# === 仮想環境リセット ===
deactivate                 # 仮想環境終了
rm -rf venv               # 仮想環境削除
python -m venv venv       # 再作成
source venv/bin/activate  # 有効化
pip install -e ".[dev]"   # 再インストール
```

## 📚 API 仕様

### エンドポイント一覧

| メソッド | エンドポイント              | 説明                   |
| -------- | --------------------------- | ---------------------- |
| GET      | `/`                         | サービス情報           |
| GET      | `/health`                   | ヘルスチェック         |
| POST     | `/upload-pdf`               | PDF アップロード・解析 |
| POST     | `/export-pdf/{schedule_id}` | PDF 生成・出力         |

### API 例

#### ヘルスチェック

```bash
curl -X GET http://localhost:8000/health
```

**レスポンス:**

```json
{
  "status": "healthy",
  "timestamp": "2025-08-10T10:00:00.000000",
  "version": "1.0.0",
  "service": "HomeSync PDF Service"
}
```

#### PDF アップロード（将来実装予定）

```bash
curl -X POST http://localhost:8000/upload-pdf \
  -F "pdf=@sample_schedule.pdf" \
  -F "project_id=123e4567-e89b-12d3-a456-426614174000"
```

**レスポンス:**

```json
{
  "status": "success",
  "schedule_id": "456e7890-e89b-12d3-a456-426614174001"
}
```

## 🔄 開発ワークフロー

### 1. 機能開発フロー

```bash
# 1. 最新コードを取得
git pull origin develop

# 2. フィーチャーブランチ作成
git checkout -b feature/pdf-upload

# 3. 開発サーバー起動
uvicorn app.main:app --reload

# 4. コード編集・テスト
# ... 開発作業 ...

# 5. コード品質チェック
black .
ruff check --fix .
mypy .
pytest

# 6. コミット
git add .
git commit -m "feat: PDFアップロード機能実装"

# 7. プッシュ・プルリクエスト
git push origin feature/pdf-upload
```

### 2. 新しい API エンドポイント追加

```bash
# 1. スキーマ定義（app/schemas/）
# 2. サービスロジック実装（app/services/）
# 3. APIエンドポイント作成（app/api/v1/）
# 4. テスト作成（app/tests/）
# 5. ドキュメント更新
```

## 🧪 テスト

### テスト構成

```
app/tests/
├── __init__.py
├── conftest.py           # テスト設定・フィクスチャ
├── test_main.py          # アプリケーション基本機能
├── test_config.py        # 設定管理
├── test_database.py      # データベース接続
└── api/
    └── test_pdf.py       # PDFエンドポイント
```

### テスト実行

```bash
# 全テスト実行
pytest

# 詳細出力付き
pytest -v

# カバレッジレポート
pytest --cov=app

# 特定テストファイル
pytest app/tests/test_main.py

# 特定テスト関数
pytest app/tests/test_main.py::test_health_check
```

### テストデータ作成

```python
# conftest.py例
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_pdf():
    return open("samples/sample_schedule.pdf", "rb")
```

## 🚀 デプロイメント

### Railway/Render デプロイ

#### 1. 環境変数設定

デプロイ先で以下の環境変数を設定：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx...
ALLOWED_ORIGINS=https://your-frontend.vercel.app
ENVIRONMENT=production
DEBUG=false
```

#### 2. デプロイコマンド

```bash
# Railway CLI使用例
railway up

# または Git push でデプロイ
git push origin main
```

### Docker デプロイ

```bash
# イメージビルド
docker build -t homesync-pdf-service .

# コンテナ実行
docker run -p 8000:8000 --env-file .env homesync-pdf-service
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. `ModuleNotFoundError: No module named 'app'`

**原因**: 仮想環境が有効化されていない、または依存関係がインストールされていない

**解決策**:

```bash
source venv/bin/activate
pip install -e ".[dev]"
```

#### 2. `ImportError: cannot import name 'settings' from 'app.config'`

**原因**: `.env`ファイルがない、または環境変数が設定されていない

**解決策**:

```bash
# .envファイルを作成して必要な変数を設定
cp .env.example .env  # テンプレートがある場合
```

#### 3. `Supabase connection failed`

**原因**: Supabase 認証情報が正しくない

**解決策**:

```bash
# Supabaseダッシュボードで確認
# - Project URL
# - Service Role Key
```

#### 4. `PyMuPDF installation failed`

**原因**: PyMuPDF のネイティブ依存関係がインストールされていない

**解決策**:

```bash
# macOS
brew install mupdf-tools

# Ubuntu/Debian
sudo apt-get install mupdf mupdf-tools

# その後再インストール
pip install --force-reinstall PyMuPDF
```

### ログレベル調整

```env
# .env ファイルで調整
LOG_LEVEL=debug  # debug, info, warning, error
```

### パフォーマンス監視

```bash
# メモリ使用量確認
ps aux | grep uvicorn

# ログ監視
tail -f app.log
```

## 📖 Python 開発のベストプラクティス

### 1. コーディング規約

```python
# ✅ Good
def process_pdf(file_path: str) -> dict[str, Any]:
    """
    PDFファイルを処理して構造化データを返す

    Args:
        file_path: PDFファイルのパス

    Returns:
        dict: 抽出されたデータ

    Raises:
        PDFProcessingError: PDF処理に失敗した場合
    """
    try:
        # 処理ロジック
        return {"status": "success"}
    except Exception as e:
        logger.error(f"PDF処理エラー: {e}")
        raise PDFProcessingError(str(e))

# ❌ Bad
def process(file):  # 型アノテーションなし
    # ドキュメンテーションなし
    return data  # 何が返されるかわからない
```

### 2. エラーハンドリング

```python
# ✅ 具体的な例外をキャッチ
try:
    result = risky_operation()
except SpecificException as e:
    logger.error(f"特定のエラー: {e}")
    # 適切な対処
except Exception as e:
    logger.error(f"予期しないエラー: {e}")
    # 一般的な対処

# ❌ 全ての例外をキャッチ
try:
    result = risky_operation()
except:  # bare except は避ける
    pass  # エラーを隠してしまう
```

### 3. 設定管理

```python
# ✅ Pydantic Settings使用
class Settings(BaseSettings):
    database_url: str
    debug: bool = False

    class Config:
        env_file = ".env"

# ❌ 直接環境変数アクセス
DATABASE_URL = os.environ["DATABASE_URL"]  # KeyErrorの可能性
```

### 4. 依存性注入

```python
# ✅ FastAPIの依存性注入
from fastapi import Depends

def get_db() -> Client:
    return supabase_client

@app.post("/upload")
async def upload_pdf(db: Client = Depends(get_db)):
    # dbは自動で注入される
    pass

# ❌ グローバル変数直接使用
@app.post("/upload")
async def upload_pdf():
    # グローバル変数に依存
    global supabase_client
```

### 5. テスト作成

```python
# ✅ 良いテスト
def test_health_check(client):
    """ヘルスチェックAPIが正常に動作することを確認"""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

# ❌ 悪いテスト
def test_something():
    # 何をテストしているかわからない
    assert True
```

---

## 🤝 コントリビューション

1. Issue を確認・作成
2. フィーチャーブランチを作成
3. コード変更・テスト追加
4. プルリクエスト作成

## 📄 ライセンス

MIT License

---

**作成日**: 2025/08/10  
**バージョン**: 1.0  
**メンテナー**: Jukiya

この README は、Python 開発が初めての方でも安心して開発を始められるように、詳細な説明とサンプルコードを含んでいます。不明な点があれば、遠慮なく質問してください。
