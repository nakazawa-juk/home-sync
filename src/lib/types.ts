export interface Project {
  id: string;
  project_number: string;
  project_name: string;
  construction_location: string;
  construction_company: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = '未着手' | '進行中' | '完了' | '遅延' | '中断';

export interface ScheduleItem {
  id: string;
  process_name: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: ProjectStatus;
  assignee?: string;
  remarks?: string;
  order_index: number;
}

export interface ProjectSchedule {
  id: string;
  project_id: string;
  version: number;
  schedule_items: ScheduleItem[];
  created_at: string;
}

export interface FilterOptions {
  status?: ProjectStatus[];
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
