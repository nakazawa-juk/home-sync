import { Suspense } from 'react';
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
import { getProject } from '@/app/actions/projects';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Download, Edit } from 'lucide-react';
import Link from 'next/link';
import { ScheduleStatus, ProjectWithSchedule, ScheduleItem } from '@/lib/types';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// プロジェクトの全体ステータスを工程表から計算
function getProjectStatus(project: ProjectWithSchedule): ScheduleStatus {
  if (
    !project.latest_schedule?.schedule_items ||
    project.latest_schedule.schedule_items.length === 0
  ) {
    return '未着手';
  }

  const items = project.latest_schedule.schedule_items;
  const statusCounts = items.reduce(
    (acc: Record<ScheduleStatus, number>, item: ScheduleItem) => {
      const status = item.status || '未着手';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<ScheduleStatus, number>,
  );

  // 優先順位: 遅延 > 中断 > 進行中 > 完了 > 未着手
  if (statusCounts['遅延'] > 0) return '遅延';
  if (statusCounts['中断'] > 0) return '中断';
  if (statusCounts['進行中'] > 0) return '進行中';
  if (statusCounts['完了'] === items.length) return '完了';

  return '進行中'; // 一部完了している場合
}

async function ProjectDetailContainer({ projectId }: { projectId: string }) {
  const { data: project, error } = await getProject(projectId);

  if (error) {
    return (
      <Layout title="エラー">
        <div className="text-center py-12">
          <div className="text-red-500">
            <p className="text-lg font-medium">エラーが発生しました</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
          <Link href="/projects" className="mt-4 inline-block">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              プロジェクト一覧に戻る
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout title="プロジェクトが見つかりません">
        <div className="text-center py-12">
          <p className="text-gray-500">
            指定されたプロジェクトが見つかりません。
          </p>
          <Link href="/projects" className="mt-4 inline-block">
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
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            </Link>
            <Badge variant="status" status={getProjectStatus(project)} />
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
            <ProjectOverview
              project={project}
              schedule={project.latest_schedule}
            />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {project.latest_schedule ? (
              <ScheduleTable schedule={project.latest_schedule} />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">工程表データがありません。</p>
                <Button className="mt-4">工程表を作成</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gantt" className="space-y-6">
            {project.latest_schedule ? (
              <GanttChart schedule={project.latest_schedule} />
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

// ローディング用のスケルトンコンポーネント
function ProjectDetailSkeleton() {
  return (
    <Layout title="読み込み中...">
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Layout>
  );
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetailContainer projectId={id} />
    </Suspense>
  );
}
