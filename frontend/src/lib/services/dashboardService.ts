import {
  getProjectsWithSchedules,
  addStatusToProjects,
  type ProjectWithStatus,
} from './projectService';

export type DashboardStats = {
  total: number;
  inProgress: number;
  completed: number;
  delayed: number;
};

export type DashboardData = {
  projects: ProjectWithStatus[];
  stats: DashboardStats;
  recentProjects: ProjectWithStatus[];
};

/**
 * ダッシュボード用のデータを取得
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    // プロジェクト一覧を取得
    const projects = await getProjectsWithSchedules();

    // プロジェクトにステータスを付与
    const projectsWithStatus = addStatusToProjects(projects);

    // 統計情報を計算
    const stats: DashboardStats = {
      total: projectsWithStatus.length,
      inProgress: projectsWithStatus.filter((p) => p.status === '進行中')
        .length,
      completed: projectsWithStatus.filter((p) => p.status === '完了').length,
      delayed: projectsWithStatus.filter((p) => p.status === '遅延').length,
    };

    // 最近のプロジェクト（最大5件）
    const recentProjects = projectsWithStatus.slice(0, 5);

    return {
      projects: projectsWithStatus,
      stats,
      recentProjects,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);

    // エラー時のフォールバック
    return {
      projects: [],
      stats: {
        total: 0,
        inProgress: 0,
        completed: 0,
        delayed: 0,
      },
      recentProjects: [],
    };
  }
}
