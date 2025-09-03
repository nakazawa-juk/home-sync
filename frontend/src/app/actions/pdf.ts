'use server';

import { revalidatePath } from 'next/cache';
import { uploadPDF, PDFUploadResponse } from '@/lib/services/pdfUploadService';

export interface PDFUploadResult {
  success: boolean;
  data?: PDFUploadResponse;
  error?: string;
}

/**
 * PDFファイルをアップロードして工程表データを抽出
 * @param formData - FormData（pdfファイルとprojectIdを含む）
 * @returns PDFUploadResult - アップロード結果
 */
export async function uploadPDFAction(
  formData: FormData,
): Promise<PDFUploadResult> {
  try {
    const pdfFile = formData.get('pdf') as File;
    const projectId = formData.get('projectId') as string;

    // バリデーション
    if (!pdfFile || pdfFile.size === 0) {
      return {
        success: false,
        error: 'PDFファイルが選択されていません。',
      };
    }

    if (!projectId) {
      return {
        success: false,
        error: 'プロジェクトIDが指定されていません。',
      };
    }

    // PDFアップロード実行
    const result = await uploadPDF(pdfFile, projectId);

    // 関連ページのキャッシュを更新
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('PDF upload action error:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'PDFのアップロードに失敗しました。';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * PDFアップロード成功後のリダイレクト処理
 * @param projectId - プロジェクトID
 * @param scheduleId - 作成された工程表ID
 */
export async function redirectAfterUpload(
  projectId: string,
  scheduleId: string,
) {
  // Next.jsのredirect関数を使用してリダイレクト
  const { redirect } = await import('next/navigation');
  redirect(`/projects/${projectId}?schedule_id=${scheduleId}&uploaded=true`);
}
