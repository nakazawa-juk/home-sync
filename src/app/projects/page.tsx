'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout';
import { ProjectList, ProjectFilters } from '@/components/projects';
import { Button } from '@/components/ui';
import { Plus, Upload } from 'lucide-react';
import { mockProjects } from '@/lib/mockData';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const [filteredProjects, setFilteredProjects] =
    useState<Project[]>(mockProjects);

  const handleFilterChange = (filters: {
    search?: string;
    status?: string[];
    company?: string;
  }) => {
    let filtered = [...mockProjects];

    // 検索フィルター
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.project_name.toLowerCase().includes(searchLower) ||
          project.construction_location.toLowerCase().includes(searchLower) ||
          project.construction_company.toLowerCase().includes(searchLower),
      );
    }

    // ステータスフィルター
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((project) =>
        filters.status.includes(project.status),
      );
    }

    // 会社フィルター
    if (filters.company) {
      const companyLower = filters.company.toLowerCase();
      filtered = filtered.filter((project) =>
        project.construction_company.toLowerCase().includes(companyLower),
      );
    }

    setFilteredProjects(filtered);
  };

  return (
    <Layout
      title="プロジェクト一覧"
      subtitle="進行中の住宅建設プロジェクトを管理"
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              全 {filteredProjects.length} 件のプロジェクト
            </h2>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              PDFインポート
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規プロジェクト
            </Button>
          </div>
        </div>

        {/* Filters */}
        <ProjectFilters onFilterChange={handleFilterChange} />

        {/* Project List */}
        <ProjectList projects={filteredProjects} />
      </div>
    </Layout>
  );
}
