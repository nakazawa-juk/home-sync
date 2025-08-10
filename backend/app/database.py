import logging

from supabase import Client, create_client

from app.config import settings

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """
    Supabaseクライアントを取得する

    Returns:
        Client: Supabaseクライアントインスタンス

    Raises:
        Exception: 接続に失敗した場合
    """
    try:
        supabase: Client = create_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
        logger.info("Supabase client initialized successfully")
        return supabase
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise


# グローバルクライアントインスタンス（依存性注入で使用）
supabase_client: Client = None


async def init_database():
    """
    データベース接続を初期化する
    """
    global supabase_client
    try:
        supabase_client = get_supabase_client()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


def get_db() -> Client:
    """
    データベースクライアントを取得する（依存性注入用）

    Returns:
        Client: Supabaseクライアント
    """
    if supabase_client is None:
        raise Exception("Database not initialized")
    return supabase_client
