import { Suspense } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout';
import { ProjectList, PDFImportButton } from '@/components/projects';
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';
import { getProjects } from '@/app/actions/projects';
import { ProjectWithSchedule, Project } from '@/lib/types';

// プロジェクト一覧の取得とレンダリングを分離
async function ProjectListContainer() {
  const { data: projects, error } = await getProjects();

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500">
          <p className="text-lg font-medium">エラーが発生しました</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
        <div className="mt-6">
          <a href="/projects">
            <Button variant="outline">再試行</Button>
          </a>
        </div>
      </div>
    );
  }

  // プロジェクトデータをProjectWithSchedule型に変換（今の段階では工程表データなし）
  const projectsWithSchedule: ProjectWithSchedule[] =
    projects?.map((project) => ({
      ...project,
      latest_schedule: undefined, // 後で工程表データを追加
    })) || [];

  return <ProjectList projects={projectsWithSchedule} />;
}

// PDFインポートボタン用のプロジェクトデータ取得
async function PDFImportContainer() {
  const { data: projects } = await getProjects();
  const projectList: Project[] = projects || [];

  return <PDFImportButton projects={projectList} />;
}

// ローディング用のスケルトンコンポーネント
function ProjectListSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-t-lg"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-t border-gray-200">
            <div className="h-16 bg-gray-100"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
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
              プロジェクト一覧
            </h2>
          </div>
          <div className="flex gap-3">
            <Suspense
              fallback={
                <Button variant="outline" disabled>
                  PDFインポート
                </Button>
              }
            >
              <PDFImportContainer />
            </Suspense>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新規プロジェクト
              </Button>
            </Link>
          </div>
        </div>

        {/* TODO: Filters - クライアントサイドコンポーネントとして実装予定 */}
        {/* <ProjectFilters onFilterChange={handleFilterChange} /> */}

        {/* Project List */}
        <Suspense fallback={<ProjectListSkeleton />}>
          <ProjectListContainer />
        </Suspense>
      </div>
    </Layout>
  );
}
