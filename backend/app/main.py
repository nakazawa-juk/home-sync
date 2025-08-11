import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_database

# ログ設定
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    アプリケーションのライフサイクル管理
    """
    # 起動時の処理
    logger.info("Starting HomeSync PDF Service...")
    try:
        await init_database()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise

    yield

    # 終了時の処理
    logger.info("Shutting down HomeSync PDF Service...")


# FastAPIアプリケーション初期化
app = FastAPI(
    title="HomeSync PDF Service",
    description="PDF processing service for HomeSync project management system",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# エラーハンドラー
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> HTTPException:
    logger.error(f"Unhandled exception: {exc}")
    return HTTPException(status_code=500, detail="Internal server error")


# ヘルスチェックエンドポイント
@app.get("/health")
async def health_check() -> dict[str, str]:
    """
    ヘルスチェックエンドポイント

    Returns:
        dict: サービスの状態情報
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "service": "HomeSync PDF Service",
    }


# ルートエンドポイント
@app.get("/")
async def root() -> dict[str, str]:
    """
    ルートエンドポイント

    Returns:
        dict: サービス情報
    """
    return {
        "message": "HomeSync PDF Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level,
    )
