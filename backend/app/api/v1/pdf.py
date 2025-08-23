"""
PDF関連のAPIエンドポイント
工程表PDF生成機能を提供
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from supabase import Client

from app.database import get_db
from app.schemas.pdf import (
    PDFGenerationError,
    PDFScheduleData,
    ProjectInfoForPDF,
    ScheduleItemForPDF,
    ScheduleNotFoundError,
)
from app.services.pdf_service import PDFGenerationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/pdf", tags=["pdf"])

# PDF生成サービス（シングルトン）
pdf_service = PDFGenerationService()


async def get_schedule_for_pdf(schedule_id: UUID, db: Client) -> PDFScheduleData:
    """
    PDF生成用のスケジュールデータ取得
    戦略文書に基づく効率的なJOIN取得

    Args:
        schedule_id: 工程表ID
        db: Supabaseクライアント

    Returns:
        PDF生成用スケジュールデータ

    Raises:
        ScheduleNotFoundError: スケジュールが見つからない場合
    """
    try:
        # Supabaseクエリ（JOINを使用した効率的なデータ取得）
        result = (
            db.table("project_schedules")
            .select(
                """
                id,
                version,
                created_at,
                projects!inner(
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
            """
            )
            .eq("id", str(schedule_id))
            .execute()
        )

        if not result.data:
            logger.warning(f"Schedule not found: {schedule_id}")
            raise ScheduleNotFoundError(f"Schedule {schedule_id} not found")

        schedule_record = result.data[0]
        project_data = schedule_record["projects"]
        items_data = schedule_record["schedule_items"]

        # Pydanticモデルに変換
        project_info = ProjectInfoForPDF(
            project_number=project_data["project_number"],
            project_name=project_data["project_name"],
            construction_location=project_data.get("construction_location"),
            construction_company=project_data.get("construction_company"),
        )

        # order_indexでソート後にPydanticモデル作成
        sorted_items_data = sorted(items_data, key=lambda x: x.get("order_index", 0))

        schedule_items = [
            ScheduleItemForPDF(
                process_name=item["process_name"],
                planned_start_date=item.get("planned_start_date"),
                planned_end_date=item.get("planned_end_date"),
                actual_start_date=item.get("actual_start_date"),
                actual_end_date=item.get("actual_end_date"),
                assignee=item.get("assignee"),
                status=item.get("status", "未着手"),
                remarks=item.get("remarks"),
                order_index=item.get("order_index", 0),
            )
            for item in sorted_items_data
        ]

        pdf_data = PDFScheduleData(
            schedule_id=schedule_id,
            version=schedule_record["version"],
            project_info=project_info,
            schedule_items=schedule_items,
        )

        logger.info(
            f"Schedule data loaded for PDF: {schedule_id}, "
            f"Project: {project_info.project_name}, "
            f"Items: {len(schedule_items)}"
        )

        return pdf_data

    except ScheduleNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error fetching schedule data for PDF: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch schedule data"
        ) from e


@router.post("/export-pdf/{schedule_id}")
async def export_pdf(schedule_id: UUID, db: Client = Depends(get_db)) -> Response:
    """
    工程表PDF生成・エクスポート

    Args:
        schedule_id: 工程表ID（UUID）
        db: Supabaseクライアント（依存性注入）

    Returns:
        PDFファイル（application/pdf）

    Raises:
        HTTPException:
            - 404: スケジュールが見つからない
            - 500: PDF生成に失敗
    """
    try:
        logger.info(f"PDF export request for schedule: {schedule_id}")

        # スケジュールデータ取得
        schedule_data = await get_schedule_for_pdf(schedule_id, db)

        # PDF生成（メモリ上で処理）
        pdf_bytes = pdf_service.generate_pdf_bytes(schedule_data)

        # ファイル名生成
        filename = pdf_service.generate_filename(schedule_data)

        logger.info(f"PDF export completed: {filename}, Size: {len(pdf_bytes)} bytes")

        # PDFレスポンス（戦略文書に基づくメモリレスポンス）
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except ScheduleNotFoundError as e:
        logger.warning(f"Schedule not found for PDF export: {e}")
        raise HTTPException(status_code=404, detail=str(e)) from e

    except PDFGenerationError as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e

    except Exception as e:
        logger.error(f"Unexpected error in PDF export: {e}")
        raise HTTPException(status_code=500, detail="PDF export failed") from e


@router.get("/health")
async def pdf_service_health() -> dict[str, str]:
    """
    PDFサービス専用ヘルスチェック

    Returns:
        PDFサービスの状態情報
    """
    try:
        # フォント検証
        font_available = pdf_service.font_path

        return {
            "service": "PDF Generation Service",
            "status": "healthy",
            "font_available": str(font_available),
            "font_path": pdf_service.font_path or "system_default",
        }

    except Exception as e:
        logger.error(f"PDF service health check failed: {e}")
        raise HTTPException(status_code=503, detail="PDF service unavailable") from e
