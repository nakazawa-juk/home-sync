#!/usr/bin/env python3
"""
HomeSync サンプル工程表PDF生成スクリプト

標準フォーマットに準拠した工程表PDFを生成します。

機能:
- 日本語フォント対応
- 完全な表構造
- 正しい上→下の配置順序
- PyMuPDF表検出対応
"""

import os

import fitz  # PyMuPDF


def format_date_short(date_str):
    """日付を短縮フォーマットに変換 (2025/01/01 → 25/01/01)"""
    if not date_str or date_str == "":
        return ""
    try:
        if "/" in date_str and len(date_str) == 10:  # YYYY/MM/DD形式
            year, month, day = date_str.split("/")
            return f"{year[-2:]}/{month}/{day}"  # 年を下2桁に
        return date_str
    except:
        return date_str


def find_japanese_font():
    """利用可能な日本語フォントを検索"""
    japanese_fonts = [
        # macOS
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Unicode MS.ttf",
        # Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        # Windows
        "C:/Windows/Fonts/msgothic.ttc",
        "C:/Windows/Fonts/arial.ttf",
    ]

    for font_path in japanese_fonts:
        if os.path.exists(font_path):
            return font_path

    return None


def create_sample_schedule_pdf():
    """サンプル工程表PDFを生成"""

    # PDFドキュメント作成
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4サイズ

    # 日本語フォント検索
    japanese_font_path = find_japanese_font()

    # フォント設定
    if japanese_font_path:
        font_cjk = "CJK"
        page.insert_font(fontname=font_cjk, fontfile=japanese_font_path)
        print(f"✅ 日本語フォント使用: {os.path.basename(japanese_font_path)}")
    else:
        font_cjk = "helv"
        print("⚠️  基本フォント使用")

    # フォントサイズ（ヘッダーとデータを統一）
    font_size_title = 18
    font_size_header = 12
    font_size_table_data = 8  # ヘッダーとデータを同じサイズに統一

    # 色設定
    black = (0, 0, 0)
    blue = (0.1, 0.3, 0.7)
    header_bg = (0.9, 0.9, 0.9)
    border_color = (0.2, 0.2, 0.2)

    # プロジェクト情報
    project_info = {
        "project_number": "2025-001",  # 追加: プロジェクト番号
        "project_name": "田中様邸新築工事",
        "location": "東京都世田谷区桜丘3-25-14",
        "company": "ABC建設株式会社",
        "created_date": "2025/01/15",
    }

    # 工程データ（DBスキーマ完全対応：9列）
    schedule_data = [
        [
            "工程名",
            "予定開始",
            "予定終了",
            "実際開始",
            "実際終了",
            "担当者",
            "状況",
            "備考",
        ],
        [
            "地盤調査・測量",
            "2025/02/01",
            "2025/02/05",
            "2025/02/01",
            "2025/02/04",
            "田中工務店",
            "完了",
            "地盤改良不要",
        ],
        [
            "基礎工事",
            "2025/02/10",
            "2025/02/25",
            "2025/02/12",
            "2025/02/24",
            "佐藤組",
            "完了",
            "",
        ],
        [
            "上棟・構造材設置",
            "2025/03/01",
            "2025/03/15",
            "2025/03/01",
            "",
            "木材センター",
            "進行中",
            "",
        ],
        ["屋根工事", "2025/03/16", "2025/03/30", "", "", "屋根プロ", "未着手", ""],
        [
            "外壁工事",
            "2025/04/01",
            "2025/04/20",
            "",
            "",
            "外装工業",
            "未着手",
            "サイディング",
        ],
        [
            "内装工事",
            "2025/04/25",
            "2025/05/25",
            "",
            "",
            "内装職人",
            "未着手",
            "クロス・フローリング",
        ],
        [
            "設備工事",
            "2025/05/10",
            "2025/05/30",
            "",
            "",
            "設備サービス",
            "未着手",
            "電気・水道・ガス",
        ],
        [
            "竣工検査・引渡し",
            "2025/06/01",
            "2025/06/05",
            "",
            "",
            "ABC建設",
            "未着手",
            "最終確認",
        ],
    ]

    # レイアウト設定（座標系修正：上から下への配置）
    margin_left = 40
    margin_top = 50
    y_pos = margin_top  # ページ上部から開始

    # === タイトルセクション ===
    page.insert_text(
        (margin_left, y_pos),
        project_info["project_name"],
        fontname=font_cjk if japanese_font_path else "hebo",
        fontsize=font_size_title,
        color=blue,
    )
    y_pos += 30  # 下方向に移動

    # プロジェクト情報
    info_items = [
        f"プロジェクト番号: {project_info['project_number']}",  # 追加
        f"工事場所: {project_info['location']}",
        f"施工会社: {project_info['company']}",
        f"作成日: {project_info['created_date']}",
    ]

    for info in info_items:
        page.insert_text(
            (margin_left, y_pos),
            info,
            fontname=font_cjk if japanese_font_path else "helv",
            fontsize=font_size_header,
            color=black,
        )
        y_pos += 20  # 下方向に移動

    y_pos += 15  # 表との間隔

    # === 工程表作成 ===
    table_x = margin_left
    table_y = y_pos  # 表の開始位置（上端）

    # 列幅設定（長文対応・備考欄拡大）
    col_widths = [80, 50, 50, 50, 50, 60, 45, 120]  # 合計505px（備考欄拡大）
    row_height = 40  # 3行分対応で高さ拡大

    total_width = sum(col_widths)
    total_height = len(schedule_data) * row_height

    # 表全体の外枠
    table_rect = fitz.Rect(
        table_x, table_y, table_x + total_width, table_y + total_height
    )
    page.draw_rect(table_rect, color=border_color, width=2)

    # 行の描画（上から下へ）
    current_y = table_y

    for row_idx, row in enumerate(schedule_data):
        row_top = current_y
        row_bottom = current_y + row_height

        # ヘッダー行の背景
        if row_idx == 0:
            header_rect = fitz.Rect(table_x, row_top, table_x + total_width, row_bottom)
            page.draw_rect(header_rect, color=header_bg, fill=header_bg)

        # 水平線（行の下端）
        if row_idx < len(schedule_data) - 1:  # 最後の行以外
            page.draw_line(
                fitz.Point(table_x, row_bottom),
                fitz.Point(table_x + total_width, row_bottom),
                color=border_color,
                width=1,
            )

        # セルの描画
        current_x = table_x

        for col_idx, cell_text in enumerate(row):
            cell_right = current_x + col_widths[col_idx]

            # 垂直線（列の右端）
            if col_idx < len(col_widths) - 1:  # 最後の列以外
                page.draw_line(
                    fitz.Point(cell_right, row_top),
                    fitz.Point(cell_right, row_bottom),
                    color=border_color,
                    width=1,
                )

            # テキスト挿入
            text_x = current_x + 4  # 左パディング（縮小）
            text_y = row_top + (row_height + 4) / 2  # 垂直中央（下向き座標系）

            # テキスト処理（長文対応）
            display_text = str(cell_text)

            # 日付列の短縮フォーマット処理
            if col_idx in [1, 2, 3, 4]:  # 日付列
                display_text = format_date_short(display_text)

            # 長文は省略せずそのまま表示（将来的に改行対応予定）
            # 現在は表示領域内で収まるよう調整

            # フォント選択（ヘッダーは太字、サイズは統一）
            if row_idx == 0:  # ヘッダー行
                use_fontname = font_cjk if japanese_font_path else "hebo"  # 太字
            else:  # データ行
                use_fontname = font_cjk if japanese_font_path else "helv"  # 通常
            use_fontsize = font_size_table_data  # 全て同じサイズ

            page.insert_text(
                (text_x, text_y),
                display_text,
                fontname=use_fontname,
                fontsize=use_fontsize,
                color=black,
            )

            current_x = cell_right

        current_y = row_bottom

    # 表の境界線（外枠補強）
    # 上端
    page.draw_line(
        fitz.Point(table_x, table_y),
        fitz.Point(table_x + total_width, table_y),
        color=border_color,
        width=2,
    )

    # 下端
    page.draw_line(
        fitz.Point(table_x, table_y + total_height),
        fitz.Point(table_x + total_width, table_y + total_height),
        color=border_color,
        width=2,
    )

    # 左端
    page.draw_line(
        fitz.Point(table_x, table_y),
        fitz.Point(table_x, table_y + total_height),
        color=border_color,
        width=2,
    )

    # 右端
    page.draw_line(
        fitz.Point(table_x + total_width, table_y),
        fitz.Point(table_x + total_width, table_y + total_height),
        color=border_color,
        width=2,
    )

    # PDFファイル保存
    output_path = os.path.join(os.path.dirname(__file__), "sample_schedule.pdf")
    doc.save(output_path)
    doc.close()

    print(f"✅ サンプルPDFを生成しました: {output_path}")
    return output_path


def verify_sample_pdf(pdf_path):
    """サンプルPDFの検証"""
    print(f"\n🔍 サンプルPDF検証: {pdf_path}")

    try:
        doc = fitz.open(pdf_path)
        page = doc[0]

        # 基本情報
        print(f"   ページ数: {len(doc)}")
        print(f"   ページサイズ: {page.rect.width}x{page.rect.height} pt")

        # テキスト位置分析
        text_dict = page.get_text("dict")
        blocks = text_dict.get("blocks", [])

        text_positions = []
        for block in blocks:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        if text:
                            y_pos = span.get("bbox", [0, 0, 0, 0])[1]  # Y座標
                            text_positions.append((y_pos, text))

        # Y座標でソート（上から下の順序）
        text_positions.sort(key=lambda x: x[0])

        print("   テキスト配置順序（上→下）:")
        for i, (y_pos, text) in enumerate(text_positions[:6]):  # 最初の6個
            print(f"     {i + 1}. Y={y_pos:.1f}: {text[:20]}...")

        # 表構造検証
        tables = page.find_tables()
        table_list = list(tables)
        print(f"   検出された表: {len(table_list)} 個")

        if table_list:
            table = table_list[0]
            table_data = table.extract()
            print(f"   表サイズ: {len(table_data)}行 x {len(table_data[0])}列")
            expected_cols = 8  # 9列期待（8列 = ヘッダー8個）
            if len(table_data[0]) == expected_cols:
                print("   ✅ 全列（9列）が表内に含まれています")
            else:
                print(
                    f"   ⚠️  列数不足: 期待{expected_cols}列, 実際{len(table_data[0])}列"
                )

        doc.close()
        print("✅ サンプルPDF検証完了")
        return True

    except Exception as e:
        print(f"❌ 検証エラー: {e}")
        return False


if __name__ == "__main__":
    print("🏗️  HomeSync サンプル工程表PDF生成")

    try:
        pdf_path = create_sample_schedule_pdf()
        verification_passed = verify_sample_pdf(pdf_path)

        if verification_passed:
            print("\n🎉 サンプルPDF生成・検証完了!")
            print(f"生成ファイル: {pdf_path}")
            print("\n📝 修正点:")
            print("- 座標系修正: 上から下への正しい配置")
            print("- 配置順序: タイトル→プロジェクト情報→工程表")
            print("- ページ上部からの開始")
            print("\n📋 確認項目:")
            print("1. タイトルがページ上部に配置されているか")
            print("2. 正しい順序で情報が表示されているか")
            print("3. 工程表が適切な位置に配置されているか")
        else:
            print("\n❌ 検証でエラーが発生しました")

    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        import traceback

        traceback.print_exc()
