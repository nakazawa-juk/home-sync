import { Project, ProjectSchedule } from '@/lib/types';
import { formatDate, calculateProgress } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { Building, MapPin, Calendar, TrendingUp } from 'lucide-react';

interface ProjectOverviewProps {
  project: Project;
  schedule?: ProjectSchedule;
}

export function ProjectOverview({ project, schedule }: ProjectOverviewProps) {
  const progress = schedule ? calculateProgress(schedule.schedule_items) : 0;

  return (
    <div className="space-y-6">
      {/* Project Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                プロジェクト番号
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {project.project_number}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">進捗率</p>
              <p className="text-2xl font-bold text-gray-900">{progress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">工程数</p>
              <p className="text-2xl font-bold text-gray-900">
                {schedule ? schedule.schedule_items.length : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">ステータス</p>
              <Badge
                variant="status"
                status={project.status}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            プロジェクト詳細
          </h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                プロジェクト名
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.project_name}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                工事場所
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.construction_location}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                施工会社
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.construction_company}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                作成日
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(project.created_at)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                最終更新日
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(project.updated_at)}
              </dd>
            </div>

            {schedule && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  工程表バージョン
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  v{schedule.version}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Progress Overview */}
      {schedule && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">進捗概要</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>全体進捗</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              {['未着手', '進行中', '完了', '遅延', '中断'].map((status) => {
                const count = schedule.schedule_items.filter(
                  (item) => item.status === status,
                ).length;
                return (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {count}
                    </div>
                    <div className="text-sm text-gray-500">{status}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
