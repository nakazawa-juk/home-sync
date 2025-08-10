import { redirect } from 'next/navigation';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui';
import { createProject } from '@/app/actions/projects';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  async function handleCreateProject(formData: FormData) {
    'use server';

    const { data: project, error } = await createProject(formData);

    if (error) {
      // TODO: エラーハンドリングを改善（今回は単純にコンソール出力）
      console.error('プロジェクト作成エラー:', error);
      return;
    }

    if (project) {
      redirect(`/projects/${project.id}`);
    }
  }

  return (
    <Layout
      title="新規プロジェクト作成"
      subtitle="新しい住宅建設プロジェクトを登録します"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form action={handleCreateProject} className="space-y-6">
            <div>
              <label
                htmlFor="project_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                プロジェクト名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="project_name"
                name="project_name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="田中様邸新築工事"
              />
            </div>

            <div>
              <label
                htmlFor="construction_location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                工事場所
              </label>
              <input
                type="text"
                id="construction_location"
                name="construction_location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="東京都渋谷区○○町1-2-3"
              />
            </div>

            <div>
              <label
                htmlFor="construction_company"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                施工会社
              </label>
              <input
                type="text"
                id="construction_company"
                name="construction_company"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="株式会社○○建設"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/projects">
                <Button variant="outline">キャンセル</Button>
              </Link>
              <Button type="submit">プロジェクト作成</Button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            プロジェクト作成後の流れ
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• プロジェクト作成後、工程表をPDFからインポートできます</li>
            <li>• 手動で工程表を作成することも可能です</li>
            <li>• プロジェクト情報は後から編集可能です</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
