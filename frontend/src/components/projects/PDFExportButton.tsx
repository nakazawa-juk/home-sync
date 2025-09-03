'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Loader2, Upload } from 'lucide-react';
import { exportAndDownloadPDF } from '@/lib/services/pdfService';

interface PDFExportButtonProps {
  scheduleId: string;
  projectName: string;
  projectNumber: number;
  disabled?: boolean;
}

export function PDFExportButton({
  scheduleId,
  projectName,
  projectNumber,
  disabled = false,
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePDFExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      await exportAndDownloadPDF(scheduleId, projectName, projectNumber);

      // 成功時のフィードバック（オプション）
      // toast.success('PDFをダウンロードしました');
    } catch (error) {
      console.error('PDF export error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'PDFの出力に失敗しました';
      setError(errorMessage);

      // エラー表示（簡易的にalertを使用、本来はtoastやモーダルが適切）
      alert(`エラー: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={handlePDFExport}
        disabled={disabled || isExporting}
        className="relative"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {isExporting ? 'PDF生成中...' : 'PDF出力'}
      </Button>

      {/* エラー表示（UI改善のため、将来的にはToastやモーダルに変更推奨） */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm max-w-xs z-10">
          {error}
        </div>
      )}
    </div>
  );
}
