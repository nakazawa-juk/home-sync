"""
プロジェクト関連のAPIエンドポイント
プロジェクト存在チェックなどの基本機能を提供
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("/{project_id}")
async def get_project(project_id: str, db: Client = Depends(get_db)) -> dict[str, Any]:
    """
    プロジェクト情報を取得

    Args:
        project_id: プロジェクトID
        db: Supabaseクライアント（依存性注入）

    Returns:
        プロジェクト情報

    Raises:
        HTTPException: プロジェクトが見つからない場合は404
    """
    service = SupabaseService(db)

    try:
        project = await service.get_project(project_id)

        if not project:
            raise HTTPException(
                status_code=404, detail=f"Project {project_id} not found"
            )

        return project

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/")
async def list_projects(
    limit: int = 100, offset: int = 0, db: Client = Depends(get_db)
) -> list[dict[str, Any]]:
    """
    プロジェクト一覧を取得

    Args:
        limit: 取得件数
        offset: オフセット
        db: Supabaseクライアント（依存性注入）

    Returns:
        プロジェクト一覧
    """
    service = SupabaseService(db)

    try:
        projects = await service.list_projects(limit=limit, offset=offset)
        return projects

    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/{project_id}/latest-schedule")
async def get_latest_schedule(
    project_id: str, db: Client = Depends(get_db)
) -> dict[str, Any]:
    """
    プロジェクトの最新工程表を取得

    Args:
        project_id: プロジェクトID
        db: Supabaseクライアント（依存性注入）

    Returns:
        最新の工程表情報

    Raises:
        HTTPException: 工程表が見つからない場合は404
    """
    service = SupabaseService(db)

    try:
        # プロジェクト存在チェック
        project = await service.get_project(project_id)
        if not project:
            raise HTTPException(
                status_code=404, detail=f"Project {project_id} not found"
            )

        schedule = await service.get_latest_schedule(project_id)

        if not schedule:
            raise HTTPException(
                status_code=404, detail=f"No schedule found for project {project_id}"
            )

        # 工程アイテムも取得
        items = await service.get_schedule_items(schedule["id"])
        schedule["items"] = items

        return schedule

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching latest schedule: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
