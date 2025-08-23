"""
PDF関連のPydanticスキーマ定義
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ScheduleItemForPDF(BaseModel):
    """PDF生成用工程アイテム"""

    process_name: str = Field(..., description="工程名")
    planned_start_date: date | None = Field(None, description="予定開始日")
    planned_end_date: date | None = Field(None, description="予定終了日")
    actual_start_date: date | None = Field(None, description="実際開始日")
    actual_end_date: date | None = Field(None, description="実際終了日")
    assignee: str | None = Field(None, description="担当者")
    status: str = Field(default="未着手", description="進捗状況")
    remarks: str | None = Field(None, description="備考")
    order_index: int = Field(default=0, description="表示順序")


class ProjectInfoForPDF(BaseModel):
    """PDF生成用プロジェクト情報"""

    project_number: int = Field(..., description="プロジェクト番号")
    project_name: str = Field(..., description="プロジェクト名")
    construction_location: str | None = Field(None, description="工事場所")
    construction_company: str | None = Field(None, description="施工会社")


class PDFScheduleData(BaseModel):
    """PDF生成用の完全なスケジュールデータ"""

    schedule_id: UUID = Field(..., description="工程表ID")
    version: int = Field(..., description="バージョン")
    project_info: ProjectInfoForPDF = Field(..., description="プロジェクト情報")
    schedule_items: list[ScheduleItemForPDF] = Field(
        ..., description="工程アイテム一覧"
    )
    created_date: datetime = Field(
        default_factory=datetime.now, description="PDF作成日"
    )

    class Config:
        from_attributes = True


class PDFGenerationResponse(BaseModel):
    """PDF生成レスポンス"""

    status: str = Field(default="success", description="生成ステータス")
    schedule_id: UUID = Field(..., description="工程表ID")
    filename: str = Field(..., description="生成されたファイル名")
    file_size: int = Field(..., description="ファイルサイズ（バイト）")
    generated_at: datetime = Field(default_factory=datetime.now, description="生成日時")


class ScheduleNotFoundError(Exception):
    """スケジュール未発見エラー"""

    pass


class PDFGenerationError(Exception):
    """PDF生成エラー"""

    pass
