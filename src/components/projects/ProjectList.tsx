'use client';

import Link from 'next/link';
import { Eye, Edit, Download } from 'lucide-react';
import { Project } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Badge,
} from '@/components/ui';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <p className="text-lg font-medium">プロジェクトがありません</p>
          <p className="mt-2 text-sm">
            新しいプロジェクトを作成するか、PDFをインポートしてください。
          </p>
        </div>
        <div className="mt-6 space-x-4">
          <Button>新規プロジェクト作成</Button>
          <Button variant="outline">PDFインポート</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>プロジェクト番号</TableHead>
            <TableHead>プロジェクト名</TableHead>
            <TableHead className="hidden md:table-cell">工事場所</TableHead>
            <TableHead className="hidden lg:table-cell">施工会社</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead className="hidden sm:table-cell">最終更新</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                {project.project_number}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">
                    {project.project_name}
                  </div>
                  {/* Mobile view: show location */}
                  <div className="md:hidden text-sm text-gray-500 mt-1">
                    {project.construction_location}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="text-sm text-gray-600">
                  {project.construction_location}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="text-sm text-gray-600">
                  {project.construction_company}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="status" status={project.status} />
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-gray-500">
                {formatDate(project.updated_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">詳細表示</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">編集</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">ダウンロード</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
