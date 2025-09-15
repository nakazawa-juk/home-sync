// Database types (following CLAUDE.md schema)
export interface Project {
  id: string;
  project_number: number;
  project_name: string;
  construction_location?: string;
  construction_company?: string;
  created_at: string;
  updated_at: string;
}

export type ScheduleStatus = '未着手' | '進行中' | '完了' | '遅延' | '中断';

// 後方互換性のため（既存コンポーネントで使用）
export type ProjectStatus = ScheduleStatus;

export interface ProjectSchedule {
  id: string;
  project_id: string;
  version: number;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  schedule_id: string;
  process_name: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status?: ScheduleStatus;
  assignee?: string;
  remarks?: string;
  order_index: number;
}

// Insert/Update types
export interface ProjectCreateData {
  project_name: string;
  construction_location?: string;
  construction_company?: string;
}

export interface ProjectUpdateData {
  project_name?: string;
  construction_location?: string;
  construction_company?: string;
}

export interface ScheduleItemUpdateData {
  process_name?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status?: ScheduleStatus;
  assignee?: string;
  remarks?: string;
  order_index?: number;
}

// Composite types
export interface ProjectWithSchedule extends Project {
  project_schedules?: (ProjectSchedule & {
    schedule_items?: ScheduleItem[];
  })[];
  latest_schedule?: ProjectSchedule & {
    schedule_items?: ScheduleItem[];
  };
  status?: ScheduleStatus; // 計算される全体ステータス
}

// UI Filter and Sort types
export interface FilterOptions {
  status?: ScheduleStatus[];
  company?: string;
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SortOption {
  field: 'project_number' | 'project_name' | 'updated_at' | 'created_at';
  direction: 'asc' | 'desc';
}
