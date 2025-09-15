'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Download } from 'lucide-react';
import { PDFImportModal } from './PDFImportModal';
import { Project } from '@/lib/types';

interface PDFImportButtonProps {
  projects: Project[];
}

export function PDFImportButton({ projects }: PDFImportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={handleOpenModal}>
        <Download className="h-4 w-4 mr-2" />
        PDFインポート
      </Button>

      <PDFImportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        projects={projects}
      />
    </>
  );
}
