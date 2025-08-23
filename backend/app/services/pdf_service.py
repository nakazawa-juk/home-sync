"""
PDF生成サービス
PyMuPDFを使用した工程表PDF生成機能を提供
"""

import logging
import os
from datetime import datetime
from functools import lru_cache
from io import BytesIO
from typing import Any

import fitz  # PyMuPDF

from app.schemas.pdf import PDFGenerationError, PDFScheduleData, ScheduleItemForPDF

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
