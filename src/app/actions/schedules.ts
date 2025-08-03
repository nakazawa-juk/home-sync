'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  ProjectSchedule,
  ScheduleItem,
  ScheduleItemUpdateData,
} from '@/lib/types';

export async function getSchedule(scheduleId: string): Promise<{
  data: (ProjectSchedule & { schedule_items: ScheduleItem[] }) | null;
  error: string | null;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('project_schedules')
      .select(
        `
        *,
        schedule_items (*)
      `,
      )
      .eq('id', scheduleId)
      .single();

    if (error) {
      console.error('工程表取得エラー:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('工程表取得エラー:', error);
    return { data: null, error: '工程表の取得に失敗しました' };
  }
}

export async function createSchedule(
  projectId: string,
): Promise<{ data: ProjectSchedule | null; error: string | null }> {
  try {
    const supabase = createClient();

    // 既存の工程表の最大バージョンを取得
    const { data: existingSchedules } = await supabase
      .from('project_schedules')
      .select('version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion =
      existingSchedules && existingSchedules.length > 0
        ? existingSchedules[0].version + 1
        : 1;

    const { data, error } = await supabase
      .from('project_schedules')
      .insert({
        project_id: projectId,
        version: nextVersion,
      })
      .select()
      .single();

    if (error) {
      console.error('工程表作成エラー:', error);
      return { data: null, error: error.message };
    }

    revalidatePath(`/projects/${projectId}`);
    return { data, error: null };
  } catch (error) {
    console.error('工程表作成エラー:', error);
    return { data: null, error: '工程表の作成に失敗しました' };
  }
}

export async function updateScheduleItem(
  itemId: string,
  updateData: ScheduleItemUpdateData,
): Promise<{ data: ScheduleItem | null; error: string | null }> {
  try {
    const supabase = createClient();

    // 入力検証
    if (
      updateData.process_name !== undefined &&
      !updateData.process_name.trim()
    ) {
      return { data: null, error: '工程名は必須です' };
    }

    const cleanedData = {
      ...updateData,
      process_name: updateData.process_name?.trim(),
    };

    const { data, error } = await supabase
      .from('schedule_items')
      .update(cleanedData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('工程項目更新エラー:', error);
      return { data: null, error: error.message };
    }

    // 関連するプロジェクトページを再検証
    const { data: schedule } = await supabase
      .from('project_schedules')
      .select('project_id')
      .eq('id', data.schedule_id)
      .single();

    if (schedule) {
      revalidatePath(`/projects/${schedule.project_id}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error('工程項目更新エラー:', error);
    return { data: null, error: '工程項目の更新に失敗しました' };
  }
}

export async function createScheduleItem(
  scheduleId: string,
  itemData: Omit<ScheduleItem, 'id' | 'schedule_id'>,
): Promise<{ data: ScheduleItem | null; error: string | null }> {
  try {
    const supabase = createClient();

    // 入力検証
    if (!itemData.process_name?.trim()) {
      return { data: null, error: '工程名は必須です' };
    }

    const { data, error } = await supabase
      .from('schedule_items')
      .insert({
        ...itemData,
        schedule_id: scheduleId,
        process_name: itemData.process_name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('工程項目作成エラー:', error);
      return { data: null, error: error.message };
    }

    // 関連するプロジェクトページを再検証
    const { data: schedule } = await supabase
      .from('project_schedules')
      .select('project_id')
      .eq('id', scheduleId)
      .single();

    if (schedule) {
      revalidatePath(`/projects/${schedule.project_id}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error('工程項目作成エラー:', error);
    return { data: null, error: '工程項目の作成に失敗しました' };
  }
}

export async function deleteScheduleItem(
  itemId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();

    // 削除前にプロジェクトIDを取得（再検証用）
    const { data: item } = await supabase
      .from('schedule_items')
      .select(
        `
        schedule_id,
        project_schedules (project_id)
      `,
      )
      .eq('id', itemId)
      .single();

    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('工程項目削除エラー:', error);
      return { success: false, error: error.message };
    }

    // 関連するプロジェクトページを再検証
    if (item?.project_schedules) {
      const projectSchedule = Array.isArray(item.project_schedules)
        ? item.project_schedules[0]
        : item.project_schedules;
      if (projectSchedule && 'project_id' in projectSchedule) {
        revalidatePath(`/projects/${projectSchedule.project_id}`);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('工程項目削除エラー:', error);
    return { success: false, error: '工程項目の削除に失敗しました' };
  }
}

export async function reorderScheduleItems(
  items: { id: string; order_index: number }[],
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();

    // バッチ更新
    const updates = items.map((item) =>
      supabase
        .from('schedule_items')
        .update({ order_index: item.order_index })
        .eq('id', item.id),
    );

    const results = await Promise.all(updates);

    // エラーチェック
    const hasError = results.some((result) => result.error);
    if (hasError) {
      console.error(
        '工程項目並び替えエラー:',
        results.find((r) => r.error)?.error,
      );
      return { success: false, error: '工程項目の並び替えに失敗しました' };
    }

    // 関連するプロジェクトページを再検証（最初のアイテムから取得）
    if (items.length > 0) {
      const { data: item } = await supabase
        .from('schedule_items')
        .select(
          `
          schedule_id,
          project_schedules (project_id)
        `,
        )
        .eq('id', items[0].id)
        .single();

      if (item?.project_schedules) {
        const projectSchedule = Array.isArray(item.project_schedules)
          ? item.project_schedules[0]
          : item.project_schedules;
        if (projectSchedule && 'project_id' in projectSchedule) {
          revalidatePath(`/projects/${projectSchedule.project_id}`);
        }
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('工程項目並び替えエラー:', error);
    return { success: false, error: '工程項目の並び替えに失敗しました' };
  }
}

export async function bulkUpdateScheduleItems(
  scheduleId: string,
  items: Omit<ScheduleItem, 'id' | 'schedule_id'>[],
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();

    // トランザクション的な処理：既存項目を削除してから新規作成
    const { error: deleteError } = await supabase
      .from('schedule_items')
      .delete()
      .eq('schedule_id', scheduleId);

    if (deleteError) {
      console.error('既存工程項目削除エラー:', deleteError);
      return { success: false, error: '既存工程項目の削除に失敗しました' };
    }

    if (items.length > 0) {
      const itemsWithScheduleId = items.map((item, index) => ({
        ...item,
        schedule_id: scheduleId,
        process_name: item.process_name.trim(),
        order_index: item.order_index || index,
      }));

      const { error: insertError } = await supabase
        .from('schedule_items')
        .insert(itemsWithScheduleId);

      if (insertError) {
        console.error('工程項目一括作成エラー:', insertError);
        return { success: false, error: '工程項目の一括作成に失敗しました' };
      }
    }

    // 関連するプロジェクトページを再検証
    const { data: schedule } = await supabase
      .from('project_schedules')
      .select('project_id')
      .eq('id', scheduleId)
      .single();

    if (schedule) {
      revalidatePath(`/projects/${schedule.project_id}`);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('工程項目一括更新エラー:', error);
    return { success: false, error: '工程項目の一括更新に失敗しました' };
  }
}
