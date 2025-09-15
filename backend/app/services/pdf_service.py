"""
PDF生成サービス
PyMuPDFを使用した工程表PDF生成機能を提供
"""

import logging
import os
import re
from datetime import date, datetime
from functools import lru_cache
from io import BytesIO
from typing import Any
from uuid import UUID

import fitz  # PyMuPDF
from supabase import Client

from app.schemas.pdf import (
    PDFGenerationError,
    PDFScheduleData,
    PDFUploadError,
    ProjectInfoForPDF,
    ProjectNotFoundError,
    ScheduleItemForPDF,
)

logger = logging.getLogger(__name__)


class PDFGenerationService:
    """PDF生成サービスクラス"""

    # フォント設定（戦略文書に基づく）
    FONT_CONFIG = {
        "japanese": [
            "/app/fonts/NotoSansCJK-Regular.ttc",  # Docker内
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",  # Linux
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux フォールバック
            "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",  # macOS
            "/System/Library/Fonts/Helvetica.ttc",  # macOS フォールバック
        ]
    }

    # レイアウト設定
    A4_WIDTH = 595
    A4_HEIGHT = 842
    MARGIN_LEFT = 40
    MARGIN_TOP = 50

    # フォントサイズ
    FONT_SIZE_TITLE = 18
    FONT_SIZE_HEADER = 12
    FONT_SIZE_TABLE = 8

    # 色設定
    BLACK = (0, 0, 0)
    BLUE = (0.1, 0.3, 0.7)
    HEADER_BG = (0.9, 0.9, 0.9)
    BORDER_COLOR = (0.2, 0.2, 0.2)

    # 表設定
    COLUMN_WIDTHS = [80, 50, 50, 50, 50, 60, 45, 120]  # 8列の幅設定
    ROW_HEIGHT = 40

    def __init__(self):
        """初期化"""
        self.font_path = self._get_available_font()
        logger.info(f"PDFGenerationService initialized with font: {self.font_path}")

    @lru_cache(maxsize=1)
    def _get_available_font(self) -> str | None:
        """利用可能なフォントを検索（キャッシュ有効）"""
        for font_path in self.FONT_CONFIG["japanese"]:
            if os.path.exists(font_path):
                logger.info(f"Found font: {font_path}")
                return font_path

        logger.warning("No Japanese font found, using system default")
        return None

    def _format_date_short(self, date_obj: Any) -> str:
        """日付を短縮フォーマットに変換 (YYYY/MM/DD → YY/MM/DD)"""
        if not date_obj:
            return ""

        try:
            if hasattr(date_obj, "strftime"):
                # date/datetime オブジェクトの場合
                date_str = date_obj.strftime("%Y/%m/%d")
            else:
                # 文字列の場合
                date_str = str(date_obj)

            if "/" in date_str and len(date_str) == 10:  # YYYY/MM/DD形式
                year, month, day = date_str.split("/")
                return f"{year[-2:]}/{month.zfill(2)}/{day.zfill(2)}"

            return date_str
        except (ValueError, AttributeError) as e:
            logger.warning(f"Date formatting error: {e}")
            return str(date_obj) if date_obj else ""

    def _create_pdf_structure(self, schedule_data: PDFScheduleData) -> fitz.Document:
        """PDF基本構造を作成"""
        try:
            doc = fitz.open()
            page = doc.new_page(width=self.A4_WIDTH, height=self.A4_HEIGHT)

            # フォント設定
            font_cjk = "CJK"
            if self.font_path:
                page.insert_font(fontname=font_cjk, fontfile=self.font_path)
                use_japanese_font = True
            else:
                font_cjk = "helv"
                use_japanese_font = False

            # 現在の描画位置
            y_pos = self.MARGIN_TOP

            # タイトルセクション
            y_pos = self._draw_title_section(
                page, schedule_data, y_pos, font_cjk, use_japanese_font
            )

            # 工程表セクション
            self._draw_schedule_table(
                page, schedule_data.schedule_items, y_pos, font_cjk, use_japanese_font
            )

            return doc

        except Exception as e:
            logger.error(f"PDF structure creation failed: {e}")
            raise PDFGenerationError(f"Failed to create PDF structure: {e}")

    def _draw_title_section(
        self,
        page: fitz.Page,
        schedule_data: PDFScheduleData,
        start_y: float,
        font_name: str,
        use_japanese_font: bool,
    ) -> float:
        """タイトルセクションを描画"""
        try:
            y_pos = start_y

            # プロジェクト名（タイトル）
            title_font = font_name if use_japanese_font else "hebo"
            page.insert_text(
                (self.MARGIN_LEFT, y_pos),
                schedule_data.project_info.project_name,
                fontname=title_font,
                fontsize=self.FONT_SIZE_TITLE,
                color=self.BLUE,
            )
            y_pos += 30

            # プロジェクト情報
            info_items = [
                f"プロジェクト番号: {schedule_data.project_info.project_number}",
                f"工事場所: {schedule_data.project_info.construction_location or '未設定'}",
                f"施工会社: {schedule_data.project_info.construction_company or '未設定'}",
                f"作成日: {schedule_data.created_date.strftime('%Y/%m/%d')}",
            ]

            info_font = font_name if use_japanese_font else "helv"
            for info in info_items:
                page.insert_text(
                    (self.MARGIN_LEFT, y_pos),
                    info,
                    fontname=info_font,
                    fontsize=self.FONT_SIZE_HEADER,
                    color=self.BLACK,
                )
                y_pos += 20

            return y_pos + 15  # 表との間隔

        except Exception as e:
            logger.error(f"Title section drawing failed: {e}")
            raise PDFGenerationError(f"Failed to draw title section: {e}")

    def _draw_schedule_table(
        self,
        page: fitz.Page,
        schedule_items: list[ScheduleItemForPDF],
        start_y: float,
        font_name: str,
        use_japanese_font: bool,
    ) -> None:
        """工程表を描画"""
        try:
            # ヘッダー行を含むテーブルデータ作成
            table_data = [
                [
                    "工程名",
                    "予定開始",
                    "予定終了",
                    "実際開始",
                    "実際終了",
                    "担当者",
                    "状況",
                    "備考",
                ]
            ]

            # 工程アイテムを順序でソートして追加
            sorted_items = sorted(schedule_items, key=lambda x: x.order_index)
            for item in sorted_items:
                row = [
                    item.process_name,
                    self._format_date_short(item.planned_start_date),
                    self._format_date_short(item.planned_end_date),
                    self._format_date_short(item.actual_start_date),
                    self._format_date_short(item.actual_end_date),
                    item.assignee or "",
                    item.status,
                    item.remarks or "",
                ]
                table_data.append(row)

            # 表の基本設定
            table_x = self.MARGIN_LEFT
            table_y = start_y
            total_width = sum(self.COLUMN_WIDTHS)
            total_height = len(table_data) * self.ROW_HEIGHT

            # 表全体の外枠
            table_rect = fitz.Rect(
                table_x, table_y, table_x + total_width, table_y + total_height
            )
            page.draw_rect(table_rect, color=self.BORDER_COLOR, width=2)

            # 各行を描画
            current_y = table_y
            for row_idx, row in enumerate(table_data):
                row_top = current_y
                row_bottom = current_y + self.ROW_HEIGHT

                # ヘッダー行の背景
                if row_idx == 0:
                    header_rect = fitz.Rect(
                        table_x, row_top, table_x + total_width, row_bottom
                    )
                    page.draw_rect(
                        header_rect, color=self.HEADER_BG, fill=self.HEADER_BG
                    )

                # 水平線
                if row_idx < len(table_data) - 1:
                    page.draw_line(
                        fitz.Point(table_x, row_bottom),
                        fitz.Point(table_x + total_width, row_bottom),
                        color=self.BORDER_COLOR,
                        width=1,
                    )

                # セルの描画
                current_x = table_x
                for col_idx, cell_text in enumerate(row):
                    cell_right = current_x + self.COLUMN_WIDTHS[col_idx]

                    # 垂直線
                    if col_idx < len(self.COLUMN_WIDTHS) - 1:
                        page.draw_line(
                            fitz.Point(cell_right, row_top),
                            fitz.Point(cell_right, row_bottom),
                            color=self.BORDER_COLOR,
                            width=1,
                        )

                    # テキスト挿入
                    text_x = current_x + 4
                    text_y = row_top + (self.ROW_HEIGHT + 4) / 2

                    # フォント選択
                    if row_idx == 0:  # ヘッダー行
                        use_font = font_name if use_japanese_font else "hebo"
                    else:  # データ行
                        use_font = font_name if use_japanese_font else "helv"

                    page.insert_text(
                        (text_x, text_y),
                        str(cell_text),
                        fontname=use_font,
                        fontsize=self.FONT_SIZE_TABLE,
                        color=self.BLACK,
                    )

                    current_x = cell_right

                current_y = row_bottom

        except Exception as e:
            logger.error(f"Schedule table drawing failed: {e}")
            raise PDFGenerationError(f"Failed to draw schedule table: {e}")

    def generate_pdf_bytes(self, schedule_data: PDFScheduleData) -> bytes:
        """
        工程表PDFをバイト形式で生成

        Args:
            schedule_data: PDF生成用スケジュールデータ

        Returns:
            PDFバイトデータ

        Raises:
            PDFGenerationError: PDF生成に失敗した場合
        """
        try:
            logger.info(
                f"Starting PDF generation for schedule: {schedule_data.schedule_id}"
            )

            # PDF文書作成
            doc = self._create_pdf_structure(schedule_data)

            # バイトストリームに出力
            pdf_stream = BytesIO()
            doc.save(pdf_stream)
            doc.close()

            pdf_bytes = pdf_stream.getvalue()
            pdf_stream.close()

            logger.info(
                f"PDF generation completed. Size: {len(pdf_bytes)} bytes, "
                f"Items: {len(schedule_data.schedule_items)}"
            )

            return pdf_bytes

        except PDFGenerationError:
            # 既にログ出力済みなので再発生
            raise
        except Exception as e:
            logger.error(f"Unexpected error during PDF generation: {e}")
            raise PDFGenerationError(f"PDF generation failed: {e}")

    def generate_filename(self, schedule_data: PDFScheduleData) -> str:
        """
        PDF用のファイル名を生成

        Args:
            schedule_data: スケジュールデータ

        Returns:
            ファイル名（例: schedule_2025-001_v2_20250110.pdf）
        """
        timestamp = datetime.now().strftime("%Y%m%d")
        project_number = schedule_data.project_info.project_number
        version = schedule_data.version

        return f"schedule_{project_number}_v{version}_{timestamp}.pdf"

    def _parse_date(self, date_str: str) -> date | None:
        """
        日付文字列を解析してdateオブジェクトに変換

        対応フォーマット:
        - YY/MM/DD (例: 25/01/15)
        - YYYY/MM/DD (例: 2025/01/15)
        - YYYY-MM-DD (例: 2025-01-15)

        Args:
            date_str: 日付文字列

        Returns:
            dateオブジェクト、または解析失敗時はNone
        """
        if not date_str or not isinstance(date_str, str):
            return None

        date_str = date_str.strip()
        if not date_str:
            return None

        try:
            # YY/MM/DD形式 (25/01/15)
            if re.match(r"^\d{2}/\d{1,2}/\d{1,2}$", date_str):
                parts = date_str.split("/")
                year = int(parts[0])
                # 2000年代として解釈
                year = 2000 + year if year < 50 else 1900 + year
                month = int(parts[1])
                day = int(parts[2])
                return date(year, month, day)

            # YYYY/MM/DD形式 (2025/01/15)
            if re.match(r"^\d{4}/\d{1,2}/\d{1,2}$", date_str):
                parts = date_str.split("/")
                year = int(parts[0])
                month = int(parts[1])
                day = int(parts[2])
                return date(year, month, day)

            # YYYY-MM-DD形式 (2025-01-15)
            if re.match(r"^\d{4}-\d{1,2}-\d{1,2}$", date_str):
                parts = date_str.split("-")
                year = int(parts[0])
                month = int(parts[1])
                day = int(parts[2])
                return date(year, month, day)

            return None

        except (ValueError, IndexError) as e:
            logger.warning(f"Date parsing failed for '{date_str}': {e}")
            return None

    def _normalize_status(self, status_str: str) -> str:
        """
        ステータス文字列を正規化

        Args:
            status_str: 元のステータス文字列

        Returns:
            正規化されたステータス
        """
        if not status_str or not isinstance(status_str, str):
            return "未着手"

        status_str = status_str.strip()

        # ステータスマッピング
        status_mapping = {
            "未着手": "未着手",
            "進行中": "進行中",
            "完了": "完了",
            "遅延": "遅延",
            "中断": "中断",
            # よくある表記揺れ
            "着手前": "未着手",
            "未開始": "未着手",
            "実施中": "進行中",
            "作業中": "進行中",
            "終了": "完了",
            "完成": "完了",
            "済": "完了",
            "済み": "完了",
            "遅れ": "遅延",
            "停止": "中断",
            "保留": "中断",
        }

        return status_mapping.get(status_str, "未着手")

    async def extract_schedule_from_pdf(
        self, pdf_content: bytes, project_id: UUID, db: Client
    ) -> PDFScheduleData:
        """
        PDFから工程表データを抽出してデータベースに保存

        Args:
            pdf_content: PDFファイルのバイトデータ
            project_id: プロジェクトID
            db: Supabaseクライアント

        Returns:
            抽出・保存されたスケジュールデータ

        Raises:
            PDFUploadError: PDF解析に失敗した場合
            ProjectNotFoundError: プロジェクトが見つからない場合
        """
        try:
            logger.info(f"Starting PDF extraction for project: {project_id}")

            # プロジェクト存在確認
            project_info = await self._get_project_info(project_id, db)

            # PDFファイルを開く
            doc = fitz.open(stream=pdf_content, filetype="pdf")

            if doc.page_count == 0:
                raise PDFUploadError("PDFにページが含まれていません")

            # 最初のページから表を抽出
            page = doc[0]
            tables = page.find_tables()

            if not tables:
                raise PDFUploadError("PDFから表構造が検出できませんでした")

            # 最大の表を取得（工程表として扱う）
            main_table = max(tables, key=lambda t: len(t.extract()))
            table_data = main_table.extract()

            if len(table_data) < 2:  # ヘッダー + 最低1行
                raise PDFUploadError("抽出された表データが不足しています")

            logger.info(
                f"Table extracted: {len(table_data)} rows, {len(table_data[0]) if table_data else 0} columns"
            )

            # 工程アイテムを抽出
            schedule_items = self._extract_schedule_items(table_data)

            if not schedule_items:
                raise PDFUploadError("有効な工程データが見つかりませんでした")

            # データベースに保存
            schedule_data = await self._save_schedule_to_db(
                project_id, project_info, schedule_items, db
            )

            doc.close()

            logger.info(
                f"PDF extraction completed: {len(schedule_items)} items extracted, "
                f"schedule_id: {schedule_data.schedule_id}"
            )

            return schedule_data

        except (PDFUploadError, ProjectNotFoundError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error in PDF extraction: {e}")
            raise PDFUploadError(f"PDF解析中にエラーが発生しました: {str(e)}")

    async def _get_project_info(
        self, project_id: UUID, db: Client
    ) -> ProjectInfoForPDF:
        """
        プロジェクト情報を取得

        Args:
            project_id: プロジェクトID
            db: Supabaseクライアント

        Returns:
            プロジェクト情報

        Raises:
            ProjectNotFoundError: プロジェクトが見つからない場合
        """
        try:
            result = (
                db.table("projects")
                .select(
                    "project_number, project_name, construction_location, construction_company"
                )
                .eq("id", str(project_id))
                .execute()
            )

            if not result.data:
                raise ProjectNotFoundError(
                    f"プロジェクトが見つかりません: {project_id}"
                )

            project_data = result.data[0]
            return ProjectInfoForPDF(
                project_number=project_data["project_number"],
                project_name=project_data["project_name"],
                construction_location=project_data.get("construction_location"),
                construction_company=project_data.get("construction_company"),
            )

        except ProjectNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error fetching project info: {e}")
            raise PDFUploadError(f"プロジェクト情報の取得に失敗しました: {str(e)}")

    def _extract_schedule_items(
        self, table_data: list[list[str]]
    ) -> list[ScheduleItemForPDF]:
        """
        表データから工程アイテムを抽出

        想定フォーマット（8列）:
        工程名 | 予定開始 | 予定終了 | 実際開始 | 実際終了 | 担当者 | 状況 | 備考

        Args:
            table_data: 表の生データ

        Returns:
            工程アイテムのリスト
        """
        schedule_items = []

        # ヘッダー行をスキップ（1行目）
        data_rows = table_data[1:] if len(table_data) > 1 else []

        for index, row in enumerate(data_rows):
            # 空行や不完全な行をスキップ
            if not row or len([cell for cell in row if cell and cell.strip()]) < 1:
                continue

            # 最低限工程名があることを確認
            process_name = row[0].strip() if len(row) > 0 and row[0] else ""
            if not process_name:
                continue

            # 各列の値を安全に取得
            planned_start = self._parse_date(row[1]) if len(row) > 1 else None
            planned_end = self._parse_date(row[2]) if len(row) > 2 else None
            actual_start = self._parse_date(row[3]) if len(row) > 3 else None
            actual_end = self._parse_date(row[4]) if len(row) > 4 else None
            assignee = row[5].strip() if len(row) > 5 and row[5] else None
            status = self._normalize_status(row[6]) if len(row) > 6 else "未着手"
            remarks = row[7].strip() if len(row) > 7 and row[7] else None

            schedule_item = ScheduleItemForPDF(
                process_name=process_name,
                planned_start_date=planned_start,
                planned_end_date=planned_end,
                actual_start_date=actual_start,
                actual_end_date=actual_end,
                assignee=assignee,
                status=status,
                remarks=remarks,
                order_index=index,
            )

            schedule_items.append(schedule_item)

        logger.info(f"Extracted {len(schedule_items)} schedule items from PDF")
        return schedule_items

    async def _save_schedule_to_db(
        self,
        project_id: UUID,
        project_info: ProjectInfoForPDF,
        schedule_items: list[ScheduleItemForPDF],
        db: Client,
    ) -> PDFScheduleData:
        """
        工程表データをデータベースに保存

        Args:
            project_id: プロジェクトID（UUID）
            project_info: プロジェクト情報
            schedule_items: 工程アイテムリスト
            db: Supabaseクライアント

        Returns:
            保存されたスケジュールデータ
        """
        try:
            # 既存の最新バージョン番号を取得
            existing_result = (
                db.table("project_schedules")
                .select("version")
                .eq("project_id", str(project_id))  # 正しくproject_id（UUID）を使用
                .order("version", desc=True)
                .limit(1)
                .execute()
            )

            next_version = 1
            if existing_result.data:
                next_version = existing_result.data[0]["version"] + 1

            # 新しい工程表レコードを作成
            schedule_result = (
                db.table("project_schedules")
                .insert(
                    {
                        "project_id": str(project_id),  # 正しくproject_id（UUID）を使用
                        "version": next_version,
                    }
                )
                .execute()
            )

            if not schedule_result.data:
                raise PDFUploadError("工程表の作成に失敗しました")

            schedule_id = schedule_result.data[0]["id"]

            # 工程アイテムを保存
            items_data = []
            for item in schedule_items:
                item_data = {
                    "schedule_id": schedule_id,
                    "process_name": item.process_name,
                    "planned_start_date": (
                        item.planned_start_date.isoformat()
                        if item.planned_start_date
                        else None
                    ),
                    "planned_end_date": (
                        item.planned_end_date.isoformat()
                        if item.planned_end_date
                        else None
                    ),
                    "actual_start_date": (
                        item.actual_start_date.isoformat()
                        if item.actual_start_date
                        else None
                    ),
                    "actual_end_date": (
                        item.actual_end_date.isoformat()
                        if item.actual_end_date
                        else None
                    ),
                    "assignee": item.assignee,
                    "status": item.status,
                    "remarks": item.remarks,
                    "order_index": item.order_index,
                }
                items_data.append(item_data)

            items_result = db.table("schedule_items").insert(items_data).execute()

            if not items_result.data:
                raise PDFUploadError("工程アイテムの保存に失敗しました")

            # PDFScheduleDataを構築して返却
            schedule_data = PDFScheduleData(
                schedule_id=schedule_id,
                version=next_version,
                project_info=project_info,
                schedule_items=schedule_items,
            )

            logger.info(
                f"Schedule saved successfully: schedule_id={schedule_id}, "
                f"version={next_version}, items={len(schedule_items)}"
            )

            return schedule_data

        except PDFUploadError:
            raise
        except Exception as e:
            logger.error(f"Error saving schedule to database: {e}")
            raise PDFUploadError(f"データベース保存に失敗しました: {str(e)}")
