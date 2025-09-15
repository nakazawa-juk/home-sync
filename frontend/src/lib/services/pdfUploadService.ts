/**
 * PDFアップロード関連のAPIサービス
 * FastAPI（PDF Service）との通信を担当
 */

// PDF Service のベースURL（環境変数から取得）
const PDF_SERVICE_URL =
  process.env.NEXT_PUBLIC_PDF_SERVICE_URL || 'http://localhost:8000';

export interface PDFUploadError {
  detail: string;
}

export interface PDFUploadResponse {
  status: string;
  schedule_id: string;
  version: number;
  items_count: number;
  project_name: string;
  uploaded_at: string;
}

/**
 * PDFアップロード・解析
 * @param file - PDFファイル
 * @param projectId - プロジェクトID（UUID）
 * @returns Promise<PDFUploadResponse> - アップロード結果
 */
export async function uploadPDF(
  file: File,
  projectId: string,
): Promise<PDFUploadResponse> {
  try {
    // ファイル形式チェック
    if (file.type !== 'application/pdf') {
      throw new Error('PDFファイルのみアップロード可能です');
    }

    // ファイルサイズチェック（10MB制限）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('ファイルサイズが制限を超過しています（最大: 10MB）');
    }

    // FormData作成
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('project_id', projectId);

    const response = await fetch(`${PDF_SERVICE_URL}/api/v1/pdf/upload-pdf`, {
      method: 'POST',
      body: formData,
    });

    // エラーレスポンスのハンドリング
    if (!response.ok) {
      const errorData: PDFUploadError = await response.json();

      switch (response.status) {
        case 400:
          throw new Error(
            'ファイル形式が正しくないか、PDF解析に失敗しました。',
          );
        case 404:
          throw new Error('指定されたプロジェクトが見つかりません。');
        case 413:
          throw new Error('ファイルサイズが大きすぎます。');
        case 500:
          throw new Error('サーバーエラーが発生しました。');
        default:
          throw new Error(
            errorData.detail || 'PDFのアップロードに失敗しました。',
          );
      }
    }

    // レスポンスのContent-Typeをチェック
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('サーバーからの応答が正しくありません。');
    }

    const uploadResult: PDFUploadResponse = await response.json();

    return uploadResult;
  } catch (error) {
    console.error('PDF upload error:', error);

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
 * PDFサービスのヘルスチェック
 * @returns Promise<boolean> - サービスが利用可能かどうか
 */
export async function checkPDFServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PDF_SERVICE_URL}/api/v1/pdf/health`, {
      method: 'GET',
    });

    return response.ok;
  } catch (error) {
    console.error('PDF service health check error:', error);
    return false;
  }
}

/**
 * プログレス付きPDFアップロード
 * @param file - PDFファイル
 * @param projectId - プロジェクトID
 * @param onProgress - プログレス更新コールバック
 * @returns Promise<PDFUploadResponse> - アップロード結果
 */
export async function uploadPDFWithProgress(
  file: File,
  projectId: string,
  onProgress: (progress: number) => void,
): Promise<PDFUploadResponse> {
  try {
    // ファイル形式チェック
    if (file.type !== 'application/pdf') {
      throw new Error('PDFファイルのみアップロード可能です');
    }

    // ファイルサイズチェック（10MB制限）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('ファイルサイズが制限を超過しています（最大: 10MB）');
    }

    // FormData作成
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('project_id', projectId);

    // プログレス付きXMLHttpRequestを使用
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // プログレス監視
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      // レスポンス処理
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result: PDFUploadResponse = JSON.parse(xhr.responseText);
            resolve(result);
          } catch {
            reject(new Error('レスポンスの解析に失敗しました'));
          }
        } else {
          let errorMessage = 'PDFのアップロードに失敗しました';

          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.detail || errorMessage;
          } catch {
            // JSONパースに失敗した場合はデフォルトメッセージを使用
          }

          switch (xhr.status) {
            case 400:
              errorMessage =
                'ファイル形式が正しくないか、PDF解析に失敗しました。';
              break;
            case 404:
              errorMessage = '指定されたプロジェクトが見つかりません。';
              break;
            case 413:
              errorMessage = 'ファイルサイズが大きすぎます。';
              break;
            case 500:
              errorMessage = 'サーバーエラーが発生しました。';
              break;
          }

          reject(new Error(errorMessage));
        }
      });

      // エラーハンドリング
      xhr.addEventListener('error', () => {
        reject(new Error('ネットワークエラーが発生しました'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('アップロードがタイムアウトしました'));
      });

      // リクエスト送信
      xhr.open('POST', `${PDF_SERVICE_URL}/api/v1/pdf/upload-pdf`);
      xhr.timeout = 300000; // 5分タイムアウト
      xhr.send(formData);
    });
  } catch (error) {
    console.error('PDF upload with progress error:', error);
    throw error;
  }
}
