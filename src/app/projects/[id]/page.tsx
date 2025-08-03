'use client';

import { useParams } from 'next/navigation';
import { Layout } from '@/components/layout';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Badge,
} from '@/components/ui';
import {
  ProjectOverview,
  ScheduleTable,
  GanttChart,
} from '@/components/projects';
import { getProjectById, getScheduleByProjectId } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Download, Edit } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const project = getProjectById(projectId);
  const schedule = getScheduleByProjectId(projectId);

  if (!project) {
    return (
      <Layout title="プロジェクトが見つかりません">
        <div className="text-center py-12">
          <p className="text-gray-500">
            指定されたプロジェクトが見つかりません。
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              プロジェクト一覧に戻る
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={project.project_name}
      subtitle={`プロジェクト番号: ${project.project_number} | 最終更新: ${formatDate(project.updated_at)}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            </Link>
            <Badge variant="status" status={project.status} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF出力
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
          </div>
        </div>

        {/* Project Details Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="schedule">工程表</TabsTrigger>
            <TabsTrigger value="gantt">ガントチャート</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ProjectOverview project={project} schedule={schedule} />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {schedule ? (
              <ScheduleTable schedule={schedule} />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">工程表データがありません。</p>
                <Button className="mt-4">工程表を作成</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gantt" className="space-y-6">
            {schedule ? (
              <GanttChart schedule={schedule} />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">
                  ガントチャート表示用のデータがありません。
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
