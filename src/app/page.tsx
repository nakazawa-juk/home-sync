'use client';

import Link from 'next/link';
import { Layout } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { mockProjects } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Upload,
  TrendingUp,
  FolderOpen,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  // ダッシュボード用の統計データを計算
  const totalProjects = mockProjects.length;
  const statusCounts = mockProjects.reduce(
    (acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // 最近のプロジェクト（更新日順）
  const recentProjects = [...mockProjects]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 5);

  return (
    <Layout title="ダッシュボード" subtitle="プロジェクトの概要と進捗状況">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  総プロジェクト数
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalProjects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">進行中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusCounts['進行中'] || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">完了</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusCounts['完了'] || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">遅延・中断</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(statusCounts['遅延'] || 0) + (statusCounts['中断'] || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            クイックアクション
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/projects">
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                プロジェクト一覧
              </Button>
            </Link>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              新規プロジェクト
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              PDFインポート
            </Button>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                最近のプロジェクト
              </h3>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  すべて表示
                </Button>
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.project_name}
                        </p>
                        <Badge variant="status" status={project.status} />
                      </div>
                      <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                        <span>{project.project_number}</span>
                        <span>•</span>
                        <span className="truncate">
                          {project.construction_location}
                        </span>
                        <span>•</span>
                        <span>{project.construction_company}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        最終更新: {formatDate(project.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ステータス別概要
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['未着手', '進行中', '完了', '遅延', '中断'].map((status) => {
              const count = statusCounts[status] || 0;
              const percentage =
                totalProjects > 0
                  ? Math.round((count / totalProjects) * 100)
                  : 0;
              return (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {count}
                  </div>
                  <div className="text-sm text-gray-500">{status}</div>
                  <div className="text-xs text-gray-400">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
