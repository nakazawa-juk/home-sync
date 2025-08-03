import { Project, ProjectSchedule, ScheduleItem } from './types';

export const mockProjects: Project[] = [
  {
    id: '1',
    project_number: '2024-001',
    project_name: '田中様邸新築工事',
    construction_location: '東京都世田谷区砧1-1-1',
    construction_company: '東建設株式会社',
    status: '進行中',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-07-20T00:00:00Z',
  },
  {
    id: '2',
    project_number: '2024-002',
    project_name: '佐藤様邸新築工事',
    construction_location: '神奈川県横浜市青葉区美しが丘2-2-2',
    construction_company: '西建設株式会社',
    status: '完了',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-06-30T00:00:00Z',
  },
  {
    id: '3',
    project_number: '2024-003',
    project_name: '鈴木様邸新築工事',
    construction_location: '千葉県船橋市本町3-3-3',
    construction_company: '南建設株式会社',
    status: '遅延',
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-07-15T00:00:00Z',
  },
  {
    id: '4',
    project_number: '2024-004',
    project_name: '高橋様邸新築工事',
    construction_location: '埼玉県さいたま市浦和区高砂4-4-4',
    construction_company: '北建設株式会社',
    status: '未着手',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: '5',
    project_number: '2024-005',
    project_name: '中村様邸新築工事',
    construction_location: '東京都杉並区荻窪5-5-5',
    construction_company: '東建設株式会社',
    status: '中断',
    created_at: '2024-04-20T00:00:00Z',
    updated_at: '2024-05-15T00:00:00Z',
  },
];

export const mockScheduleItems: ScheduleItem[] = [
  {
    id: '1',
    process_name: '地盤調査・地縄張り',
    planned_start_date: '2024-01-20',
    planned_end_date: '2024-01-25',
    actual_start_date: '2024-01-20',
    actual_end_date: '2024-01-25',
    status: '完了',
    assignee: '山田太郎',
    remarks: '地盤状況良好',
    order_index: 1,
  },
  {
    id: '2',
    process_name: '基礎工事',
    planned_start_date: '2024-01-30',
    planned_end_date: '2024-02-15',
    actual_start_date: '2024-01-30',
    actual_end_date: '2024-02-15',
    status: '完了',
    assignee: '田中次郎',
    remarks: 'べた基礎施工完了',
    order_index: 2,
  },
  {
    id: '3',
    process_name: '上棟',
    planned_start_date: '2024-02-20',
    planned_end_date: '2024-02-25',
    actual_start_date: '2024-02-20',
    actual_end_date: '2024-02-25',
    status: '完了',
    assignee: '佐藤三郎',
    remarks: '天候に恵まれ順調に進行',
    order_index: 3,
  },
  {
    id: '4',
    process_name: '屋根工事',
    planned_start_date: '2024-03-01',
    planned_end_date: '2024-03-15',
    actual_start_date: '2024-03-01',
    actual_end_date: '2024-03-15',
    status: '完了',
    assignee: '鈴木四郎',
    remarks: 'ガルバリウム鋼板屋根施工',
    order_index: 4,
  },
  {
    id: '5',
    process_name: '外壁工事',
    planned_start_date: '2024-03-20',
    planned_end_date: '2024-04-10',
    actual_start_date: '2024-03-20',
    status: '進行中',
    assignee: '高橋五郎',
    remarks: 'サイディング施工中',
    order_index: 5,
  },
  {
    id: '6',
    process_name: '内装工事',
    planned_start_date: '2024-04-15',
    planned_end_date: '2024-05-30',
    status: '未着手',
    assignee: '中村六郎',
    remarks: '',
    order_index: 6,
  },
  {
    id: '7',
    process_name: '竣工検査',
    planned_start_date: '2024-06-01',
    planned_end_date: '2024-06-05',
    status: '未着手',
    assignee: '松本七郎',
    remarks: '検査機関との調整済み',
    order_index: 7,
  },
];

export const mockProjectSchedule: ProjectSchedule = {
  id: 'schedule-1',
  project_id: '1',
  version: 1,
  schedule_items: mockScheduleItems,
  created_at: '2024-01-15T00:00:00Z',
};

export const getProjectById = (id: string): Project | undefined => {
  return mockProjects.find((project) => project.id === id);
};

export const getScheduleByProjectId = (
  projectId: string,
): ProjectSchedule | undefined => {
  // 実際の実装では、プロジェクトIDに対応する工程表を返す
  // モックデータでは、プロジェクト1の工程表のみ用意
  if (projectId === '1') {
    return mockProjectSchedule;
  }
  return undefined;
};
