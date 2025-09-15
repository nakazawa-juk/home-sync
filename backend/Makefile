.PHONY: dev start test format lint type-check install help

# 開発サーバー起動（リロード有効）
dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 本番サーバー起動
start:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

# テスト実行
test:
	pytest

# コードフォーマット実行
format:
	black .
	ruff check --fix .

# リンター実行
lint:
	ruff check .

# 型チェック実行
type-check:
	mypy .

# 依存関係インストール（開発用含む）
install:
	pip install -e ".[dev]"

# ヘルプ表示
help:
	@echo "利用可能なコマンド:"
	@echo "  make dev        - 開発サーバー起動（リロード有効）"
	@echo "  make start      - 本番サーバー起動"
	@echo "  make test       - テスト実行"
	@echo "  make format     - コードフォーマット実行"
	@echo "  make lint       - リンター実行"
	@echo "  make type-check - 型チェック実行"
	@echo "  make install    - 依存関係インストール"
	@echo "  make help       - このヘルプを表示"
