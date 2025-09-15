'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { uploadPDFWithProgress } from '@/lib/services/pdfUploadService';
import { Project } from '@/lib/types';

interface PDFImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

interface ImportState {
  file: File | null;
  selectedProjectId: string;
  progress: number;
  isImporting: boolean;
  isCompleted: boolean;
  error: string | null;
}

export function PDFImportModal({
  isOpen,
  onClose,
  projects,
}: PDFImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({
    file: null,
    selectedProjectId: '',
    progress: 0,
    isImporting: false,
    isCompleted: false,
    error: null,
  });

  // モーダルを閉じる
  const handleClose = useCallback(() => {
    if (!importState.isImporting) {
      setImportState({
        file: null,
        selectedProjectId: '',
        progress: 0,
        isImporting: false,
        isCompleted: false,
        error: null,
      });
      onClose();
    }
  }, [importState.isImporting, onClose]);

  // ファイル選択
  const handleFileSelect = useCallback((file: File) => {
    // ファイル形式チェック
    if (file.type !== 'application/pdf') {
      setImportState((prev) => ({
        ...prev,
        error: 'PDFファイルのみインポート可能です。',
        file: null,
      }));
      return;
    }

    // ファイルサイズチェック（10MB）
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setImportState((prev) => ({
        ...prev,
        error: 'ファイルサイズが制限を超過しています（最大: 10MB）。',
        file: null,
      }));
      return;
    }

    setImportState((prev) => ({
      ...prev,
      file,
      error: null,
    }));
  }, []);

  // ファイル入力変更
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  // ドラッグ&ドロップ
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  // プロジェクト選択
  const handleProjectSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setImportState((prev) => ({
        ...prev,
        selectedProjectId: event.target.value,
      }));
    },
    [],
  );

  // インポート実行
  const handleImport = useCallback(async () => {
    if (!importState.file || !importState.selectedProjectId) {
      return;
    }

    setImportState((prev) => ({
      ...prev,
      isImporting: true,
      progress: 0,
      error: null,
    }));

    try {
      const result = await uploadPDFWithProgress(
        importState.file,
        importState.selectedProjectId,
        (progress) => {
          setImportState((prev) => ({ ...prev, progress }));
        },
      );

      setImportState((prev) => ({
        ...prev,
        isImporting: false,
        isCompleted: true,
      }));

      // 成功時は3秒後にリダイレクト
      setTimeout(() => {
        handleClose();
        router.push(
          `/projects/${importState.selectedProjectId}?schedule_id=${result.schedule_id}&imported=true`,
        );
      }, 3000);
    } catch (error) {
      console.error('Import error:', error);
      setImportState((prev) => ({
        ...prev,
        isImporting: false,
        error:
          error instanceof Error ? error.message : 'インポートに失敗しました。',
      }));
    }
  }, [importState.file, importState.selectedProjectId, handleClose, router]);

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" />

      {/* モーダル */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-lg bg-white shadow-xl transition-all">
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              PDFインポート
            </h2>
            <button
              onClick={handleClose}
              disabled={importState.isImporting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="px-6 py-6 space-y-6">
            {/* プロジェクト選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                対象プロジェクト
              </label>
              <select
                value={importState.selectedProjectId}
                onChange={handleProjectSelect}
                disabled={importState.isImporting || importState.isCompleted}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">プロジェクトを選択してください</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    [{project.project_number}] {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ファイル選択エリア */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDFファイル
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  importState.isImporting || importState.isCompleted
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInputChange}
                  disabled={importState.isImporting || importState.isCompleted}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                {importState.file ? (
                  <div className="space-y-2">
                    <FileText className="mx-auto h-8 w-8 text-blue-500" />
                    <div className="text-sm font-medium text-gray-900">
                      {importState.file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(importState.file.size)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="text-sm font-medium text-gray-900">
                      PDFファイルを選択またはドロップ
                    </div>
                    <div className="text-xs text-gray-500">
                      最大ファイルサイズ: 10MB
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* プログレスバー */}
            {importState.isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>インポート中...</span>
                  <span>{importState.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importState.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 完了メッセージ */}
            {importState.isCompleted && (
              <div className="flex items-center space-x-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">
                  インポートが完了しました。プロジェクト詳細ページに移動します...
                </span>
              </div>
            )}

            {/* エラーメッセージ */}
            {importState.error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{importState.error}</span>
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 px-6 py-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={importState.isImporting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                !importState.file ||
                !importState.selectedProjectId ||
                importState.isImporting ||
                importState.isCompleted
              }
            >
              {importState.isImporting ? 'インポート中...' : 'インポート'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
