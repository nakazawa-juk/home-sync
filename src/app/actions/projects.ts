'use server';

import { revalidatePath } from 'next/cache';
import {
  getAllProjects,
  getProjectById,
  createProject as createProjectService,
  type ProjectWithSchedules,
} from '@/lib/services/projectService';
import type { Database } from '@/lib/types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export async function getProjects(): Promise<{
  data: Project[] | null;
  error: string | null;
}> {
  try {
    const data = await getAllProjects();
    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト取得エラー:', error);
    return { data: null, error: 'プロジェクトの取得に失敗しました' };
  }
}

export async function getProject(
  id: string,
): Promise<{ data: ProjectWithSchedules | null; error: string | null }> {
  try {
    const data = await getProjectById(id);
    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト詳細取得エラー:', error);
    return { data: null, error: 'プロジェクトの詳細取得に失敗しました' };
  }
}

export async function createProject(
  formData: FormData,
): Promise<{ data: Project | null; error: string | null }> {
  try {
    const projectData: ProjectInsert = {
      project_name: formData.get('project_name') as string,
      construction_location:
        (formData.get('construction_location') as string) || null,
      construction_company:
        (formData.get('construction_company') as string) || null,
    };

    const data = await createProjectService(projectData);

    revalidatePath('/projects');
    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト作成エラー:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'プロジェクトの作成に失敗しました';
    return { data: null, error: errorMessage };
  }
}
