/**
 * PDF関連のAPIサービス
 * FastAPI（PDF Service）との通信を担当
 */

// PDF Service のベースURL（環境変数から取得）
const PDF_SERVICE_URL =
  process.env.NEXT_PUBLIC_PDF_SERVICE_URL || 'http://localhost:8000';

export interface PDFServiceError {
  detail: string;
}

export interface PDFServiceHealthResponse {
  service: string;
  status: string;
  font_available: string;
  font_path: string;
}

/**
 * PDF生成・ダウンロード
 * @param scheduleId - 工程表のID（UUID）
 * @returns Promise<Blob> - PDFファイルのバイナリデータ
 */
export async function exportSchedulePDF(scheduleId: string): Promise<Blob> {
  try {
    const response = await fetch(
      `${PDF_SERVICE_URL}/api/v1/pdf/export-pdf/${scheduleId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // エラーレスポンスのハンドリング
    if (!response.ok) {
      const errorData: PDFServiceError = await response.json();

      switch (response.status) {
        case 404:
          throw new Error('工程表が見つかりません。');
        case 500:
          throw new Error('PDF生成に失敗しました。サーバーエラーです。');
        default:
          throw new Error(errorData.detail || 'PDFの生成に失敗しました。');
      }
    }

    // レスポンスのContent-Typeをチェック
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      throw new Error('PDFファイルの生成に失敗しました。');
    }

    // PDFバイナリデータを取得
    const pdfBlob = await response.blob();

    // ファイルサイズをチェック
    if (pdfBlob.size === 0) {
      throw new Error('生成されたPDFファイルが空です。');
    }

    return pdfBlob;
  } catch (error) {
    console.error('PDF export error:', error);

    // ネットワークエラーの場合
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'PDFサービスに接続できません。サーバーが起動しているか確認してください。',
      );
    }

    // その他のエラーはそのまま再スロー
    throw error;
  }
}

/**
 * PDFファイルのダウンロード処理
 * @param blob - PDFファイルのBlobオブジェクト
 * @param filename - ダウンロードするファイル名
 */
export function downloadPDFFile(
  blob: Blob,
  filename: string = 'schedule.pdf',
): void {
  try {
    // BlobからURLを作成
    const url = window.URL.createObjectURL(blob);

    // ダウンロード用のリンク要素を作成
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // リンクを一時的にDOMに追加してクリック
    document.body.appendChild(link);
    link.click();

    // クリーンアップ
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF download error:', error);
    throw new Error('PDFファイルのダウンロードに失敗しました。');
  }
}

/**
 * PDF生成とダウンロードを一括実行
 * @param scheduleId - 工程表のID
 * @param projectName - プロジェクト名（ファイル名用）
 * @param projectNumber - プロジェクト番号（ファイル名用）
 */
export async function exportAndDownloadPDF(
  scheduleId: string,
  projectName: string = '',
  projectNumber?: number,
): Promise<void> {
  try {
    // PDF生成
    const pdfBlob = await exportSchedulePDF(scheduleId);

    // ファイル名生成
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    let filename = `schedule_${timestamp}.pdf`;

    if (projectNumber) {
      filename = `schedule_${projectNumber}_${timestamp}.pdf`;
    } else if (projectName) {
      // プロジェクト名をファイル名に使用（日本語対応）
      const sanitizedName = projectName
        .replace(/[\\/:*?"<>|]/g, '_')
        .substring(0, 50);
      filename = `schedule_${sanitizedName}_${timestamp}.pdf`;
    }

    // ダウンロード実行
    downloadPDFFile(pdfBlob, filename);
  } catch (error) {
    console.error('PDF export and download error:', error);
    throw error;
  }
}

/**
 * PDFサービスのヘルスチェック
 * @returns Promise<PDFServiceHealthResponse> - サービス状態
 */
export async function checkPDFServiceHealth(): Promise<PDFServiceHealthResponse> {
  try {
    const response = await fetch(`${PDF_SERVICE_URL}/api/v1/pdf/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`PDFサービスが利用できません (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('PDF service health check error:', error);
    throw new Error('PDFサービスに接続できません。');
  }
}
