'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  Project,
  ProjectCreateData,
  ProjectUpdateData,
  ProjectWithSchedule,
} from '@/lib/types';

export async function getProjects(): Promise<{
  data: Project[] | null;
  error: string | null;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('プロジェクト取得エラー:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト取得エラー:', error);
    return { data: null, error: 'プロジェクトの取得に失敗しました' };
  }
}

export async function getProject(
  id: string,
): Promise<{ data: ProjectWithSchedule | null; error: string | null }> {
  try {
    const supabase = createClient();

    // プロジェクト基本情報を取得
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) {
      console.error('プロジェクト取得エラー:', projectError);
      return { data: null, error: projectError.message };
    }

    // 最新の工程表を取得
    const { data: latestSchedule, error: scheduleError } = await supabase
      .from('project_schedules')
      .select(
        `
        *,
        schedule_items (*)
      `,
      )
      .eq('project_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    // 工程表がない場合もエラーにしない
    const projectWithSchedule: ProjectWithSchedule = {
      ...project,
      latest_schedule: scheduleError
        ? undefined
        : {
            ...latestSchedule,
            schedule_items: latestSchedule?.schedule_items || [],
          },
    };

    return { data: projectWithSchedule, error: null };
  } catch (error) {
    console.error('プロジェクト詳細取得エラー:', error);
    return { data: null, error: 'プロジェクトの詳細取得に失敗しました' };
  }
}

export async function createProject(
  formData: FormData,
): Promise<{ data: Project | null; error: string | null }> {
  try {
    const supabase = createClient();

    const projectData: ProjectCreateData = {
      project_name: formData.get('project_name') as string,
      construction_location:
        (formData.get('construction_location') as string) || undefined,
      construction_company:
        (formData.get('construction_company') as string) || undefined,
    };

    // 入力検証
    if (!projectData.project_name?.trim()) {
      return { data: null, error: 'プロジェクト名は必須です' };
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
      return { data: null, error: error.message };
    }

    revalidatePath('/projects');
    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト作成エラー:', error);
    return { data: null, error: 'プロジェクトの作成に失敗しました' };
  }
}

export async function updateProject(
  id: string,
  updateData: ProjectUpdateData,
): Promise<{ data: Project | null; error: string | null }> {
  try {
    const supabase = createClient();

    // 入力検証
    if (
      updateData.project_name !== undefined &&
      !updateData.project_name.trim()
    ) {
      return { data: null, error: 'プロジェクト名は必須です' };
    }

    const cleanedData = {
      ...updateData,
      project_name: updateData.project_name?.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .update(cleanedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('プロジェクト更新エラー:', error);
      return { data: null, error: error.message };
    }

    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);
    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト更新エラー:', error);
    return { data: null, error: 'プロジェクトの更新に失敗しました' };
  }
}

export async function deleteProject(
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      console.error('プロジェクト削除エラー:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/projects');
    return { success: true, error: null };
  } catch (error) {
    console.error('プロジェクト削除エラー:', error);
    return { success: false, error: 'プロジェクトの削除に失敗しました' };
  }
}

export async function searchProjects(
  query: string,
): Promise<{ data: Project[] | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(
        `project_name.ilike.%${query}%,construction_location.ilike.%${query}%,construction_company.ilike.%${query}%`,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('プロジェクト検索エラー:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト検索エラー:', error);
    return { data: null, error: 'プロジェクトの検索に失敗しました' };
  }
}
