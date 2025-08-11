"""
Supabase サービスクラス
データベース操作を管理
"""

import logging
from typing import Any

from supabase import Client

logger = logging.getLogger(__name__)


class SupabaseService:
    """Supabaseデータベース操作を管理するサービスクラス"""

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        logger.info("SupabaseService initialized")

    async def get_project(self, project_id: str) -> dict[str, Any] | None:
        """
        プロジェクト情報を取得

        Args:
            project_id: 取得するプロジェクトのID

        Returns:
            プロジェクト情報のdict、存在しない場合はNone

        Raises:
            Exception: データベースエラーが発生した場合
        """
        try:
            result = (
                self.client.table("projects")
                .select("*")
                .eq("id", project_id)
                .single()
                .execute()
            )

            return result.data

        except Exception as e:
            if "404" in str(e) or "not found" in str(e).lower():
                logger.info(f"Project {project_id} not found")
                return None

            logger.error(f"Error fetching project: {e}")
            raise

    async def get_latest_schedule(self, project_id: str) -> dict[str, Any] | None:
        """
        プロジェクトの最新工程表を取得

        Args:
            project_id: プロジェクトID

        Returns:
            最新の工程表情報、存在しない場合はNone

        Raises:
            Exception: データベースエラーが発生した場合
        """
        try:
            result = (
                self.client.table("project_schedules")
                .select("*")
                .eq("project_id", project_id)
                .order("version", desc=True)
                .limit(1)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error fetching latest schedule: {e}")
            raise

    async def get_schedule_items(self, schedule_id: str) -> list[dict[str, Any]]:
        """
        工程表の詳細アイテムを取得

        Args:
            schedule_id: 工程表ID

        Returns:
            工程アイテムのリスト

        Raises:
            Exception: データベースエラーが発生した場合
        """
        try:
            result = (
                self.client.table("schedule_items")
                .select("*")
                .eq("schedule_id", schedule_id)
                .order("order_index")
                .execute()
            )

            return result.data or []

        except Exception as e:
            logger.error(f"Error fetching schedule items: {e}")
            raise

    async def list_projects(
        self, limit: int = 100, offset: int = 0
    ) -> list[dict[str, Any]]:
        """
        プロジェクト一覧を取得

        Args:
            limit: 取得する最大件数
            offset: オフセット（ページネーション用）

        Returns:
            プロジェクトのリスト

        Raises:
            Exception: データベースエラーが発生した場合
        """
        try:
            result = (
                self.client.table("projects")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .offset(offset)
                .execute()
            )

            return result.data or []

        except Exception as e:
            logger.error(f"Error listing projects: {e}")
            raise
