import { ProjectSchedule, ScheduleItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
} from '@/components/ui';
import { Calendar, User, FileText } from 'lucide-react';

interface ScheduleTableProps {
  schedule: ProjectSchedule & { schedule_items: ScheduleItem[] };
}

export function ScheduleTable({ schedule }: ScheduleTableProps) {
  const sortedItems = [...schedule.schedule_items].sort(
    (a, b) => a.order_index - b.order_index,
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          工程表 (v{schedule.version})
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          作成日: {formatDate(schedule.created_at)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-4">#</TableHead>
              <TableHead>工程名</TableHead>
              <TableHead className="hidden md:table-cell">開始予定日</TableHead>
              <TableHead className="hidden md:table-cell">終了予定日</TableHead>
              <TableHead className="hidden lg:table-cell">実際開始日</TableHead>
              <TableHead className="hidden lg:table-cell">実際終了日</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="hidden sm:table-cell">担当者</TableHead>
              <TableHead className="hidden xl:table-cell">備考</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-gray-500">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div className="text-gray-900">{item.process_name}</div>
                    {/* Mobile view: show dates */}
                    <div className="md:hidden text-xs text-gray-500 mt-1 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        予定: {formatDate(item.planned_start_date)} ～{' '}
                        {formatDate(item.planned_end_date)}
                      </div>
                      {item.actual_start_date && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          実際: {formatDate(item.actual_start_date)}
                          {item.actual_end_date &&
                            ` ～ ${formatDate(item.actual_end_date)}`}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {formatDate(item.planned_start_date)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {formatDate(item.planned_end_date)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {item.actual_start_date
                    ? formatDate(item.actual_start_date)
                    : '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {item.actual_end_date
                    ? formatDate(item.actual_end_date)
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="status" status={item.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center text-sm">
                    <User className="h-3 w-3 mr-1 text-gray-400" />
                    {item.assignee || '-'}
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center text-sm text-gray-600">
                    {item.remarks && (
                      <>
                        <FileText className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="truncate max-w-32">
                          {item.remarks}
                        </span>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">工程データがありません。</p>
        </div>
      )}
    </div>
  );
}
