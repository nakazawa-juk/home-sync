'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectSchedule = Database['public']['Tables']['project_schedules']['Row'];
type ScheduleItem = Database['public']['Tables']['schedule_items']['Row'];

type ProjectWithSchedules = Project & {
  project_schedules: (ProjectSchedule & {
    schedule_items: ScheduleItem[];
  })[];
};

type ProjectWithStatus = ProjectWithSchedules & {
  status: '未着手' | '進行中' | '完了' | '遅延' | '中断';
};

export async function getDashboardData() {
  const supabase = createClient();

  // プロジェクト一覧を取得
  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_schedules (
        id,
        version,
        created_at,
        schedule_items (
          id,
          process_name,
          status,
          planned_start_date,
          planned_end_date,
          actual_start_date,
          actual_end_date
        )
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch dashboard data:', error);
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

  // プロジェクトにステータスを付与（最新の工程表の状態から判定）
  const projectsWithStatus = (projects || []).map((project) => {
    // 最新の工程表を取得
    const latestSchedule = project.project_schedules?.[0];

    if (!latestSchedule || !latestSchedule.schedule_items?.length) {
      return { ...project, status: '未着手' };
    }

    const items = latestSchedule.schedule_items;
    const allCompleted = items.every((item) => item.status === '完了');
    const hasDelayed = items.some((item) => item.status === '遅延');
    const hasInProgress = items.some((item) => item.status === '進行中');

    let status: ProjectWithStatus['status'] = '未着手';
    if (allCompleted) {
      status = '完了';
    } else if (hasDelayed) {
      status = '遅延';
    } else if (hasInProgress) {
      status = '進行中';
    }

    return { ...project, status };
  });

  // 統計情報を計算
  const stats = {
    total: projectsWithStatus.length,
    inProgress: projectsWithStatus.filter((p) => p.status === '進行中').length,
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
}
