import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectSchedule = Database['public']['Tables']['project_schedules']['Row'];
type ScheduleItem = Database['public']['Tables']['schedule_items']['Row'];

export type ProjectWithSchedules = Project & {
  project_schedules: (ProjectSchedule & {
    schedule_items: ScheduleItem[];
  })[];
};

export type ProjectWithStatus = ProjectWithSchedules & {
  status: '未着手' | '進行中' | '完了' | '遅延' | '中断';
};

/**
 * プロジェクト一覧を取得（工程表データ含む）
 */
export async function getProjectsWithSchedules(): Promise<
  ProjectWithSchedules[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_schedules (
        *,
        schedule_items (*)
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch projects:', error);
    throw new Error(`プロジェクト取得エラー: ${error.message}`);
  }

  return data || [];
}

/**
 * 特定のプロジェクトを取得
 */
export async function getProjectById(
  id: string,
): Promise<ProjectWithSchedules | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_schedules (
        *,
        schedule_items (*)
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch project:', error);
    if (error.code === 'PGRST116') {
      return null; // プロジェクトが見つからない
    }
    throw new Error(`プロジェクト取得エラー: ${error.message}`);
  }

  return data;
}

/**
 * プロジェクトの基本情報のみを取得
 */
export async function getAllProjects(): Promise<Project[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch projects:', error);
    throw new Error(`プロジェクト取得エラー: ${error.message}`);
  }

  return data || [];
}

/**
 * プロジェクトの工程状況からステータスを判定
 */
export function determineProjectStatus(
  project: ProjectWithSchedules,
): ProjectWithStatus['status'] {
  // 最新の工程表を取得
  const latestSchedule = project.project_schedules?.[0];

  if (!latestSchedule || !latestSchedule.schedule_items?.length) {
    return '未着手';
  }

  const items = latestSchedule.schedule_items;
  const allCompleted = items.every((item) => item.status === '完了');
  const hasDelayed = items.some((item) => item.status === '遅延');
  const hasInProgress = items.some((item) => item.status === '進行中');

  if (allCompleted) {
    return '完了';
  } else if (hasDelayed) {
    return '遅延';
  } else if (hasInProgress) {
    return '進行中';
  }

  return '未着手';
}

/**
 * プロジェクトにステータス情報を付与
 */
export function addStatusToProjects(
  projects: ProjectWithSchedules[],
): ProjectWithStatus[] {
  return projects.map((project) => ({
    ...project,
    status: determineProjectStatus(project),
  }));
}

/**
 * プロジェクトを作成
 */
export async function createProject(
  projectData: Database['public']['Tables']['projects']['Insert'],
): Promise<Project> {
  const supabase = createClient();

  // 入力検証
  if (!projectData.project_name?.trim()) {
    throw new Error('プロジェクト名は必須です');
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      project_name: projectData.project_name.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('プロジェクト作成エラー:', error);
    throw new Error(`プロジェクト作成エラー: ${error.message}`);
  }

  return data;
}
