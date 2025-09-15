'use client';

import { useMemo } from 'react';
import { ProjectSchedule, ScheduleItem } from '@/lib/types';
import { getStatusBadgeColor } from '@/lib/utils';

interface GanttChartProps {
  schedule: ProjectSchedule & { schedule_items: ScheduleItem[] };
}

export function GanttChart({ schedule }: GanttChartProps) {
  const { chartData, dateRange, totalDays } = useMemo(() => {
    const items = [...schedule.schedule_items].sort(
      (a, b) => a.order_index - b.order_index,
    );

    if (items.length === 0) {
      return { chartData: [], dateRange: [], totalDays: 0 };
    }

    // 日付範囲を計算
    const allDates = items.flatMap((item) => [
      new Date(item.planned_start_date),
      new Date(item.planned_end_date),
      ...(item.actual_start_date ? [new Date(item.actual_start_date)] : []),
      ...(item.actual_end_date ? [new Date(item.actual_end_date)] : []),
    ]);

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // 開始日を週の始まり（月曜日）に調整
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

    // 終了日を週の終わり（日曜日）に調整
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + ((7 - endDate.getDay()) % 7));

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // 週単位の日付範囲を生成
    const dateRange = [];
    for (let i = 0; i <= totalDays; i += 7) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dateRange.push(date);
    }

    // チャートデータを生成
    const chartData = items.map((item) => {
      const plannedStart = new Date(item.planned_start_date);
      const plannedEnd = new Date(item.planned_end_date);
      const actualStart = item.actual_start_date
        ? new Date(item.actual_start_date)
        : null;
      const actualEnd = item.actual_end_date
        ? new Date(item.actual_end_date)
        : null;

      const plannedStartOffset = Math.floor(
        (plannedStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const plannedDuration =
        Math.ceil(
          (plannedEnd.getTime() - plannedStart.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;

      let actualStartOffset = null;
      let actualDuration = null;

      if (actualStart) {
        actualStartOffset = Math.floor(
          (actualStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (actualEnd) {
          actualDuration =
            Math.ceil(
              (actualEnd.getTime() - actualStart.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1;
        } else {
          // 進行中の場合、現在日まで
          const today = new Date();
          actualDuration =
            Math.ceil(
              (today.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24),
            ) + 1;
        }
      }

      return {
        ...item,
        plannedStartOffset,
        plannedDuration,
        actualStartOffset,
        actualDuration,
      };
    });

    return { chartData, dateRange, totalDays };
  }, [schedule]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">
          ガントチャート表示用のデータがありません。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">ガントチャート</h3>
        <p className="text-sm text-gray-500 mt-1">
          工程表 v{schedule.version} の進捗状況
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* ヘッダー（日付） */}
          <div className="flex border-b border-gray-200">
            <div className="w-48 p-3 bg-gray-50 border-r border-gray-200 font-medium text-sm">
              工程名
            </div>
            <div className="flex-1 bg-gray-50">
              <div className="flex">
                {dateRange.map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 p-2 text-center text-xs border-r border-gray-200 last:border-r-0"
                    style={{ minWidth: `${100 / dateRange.length}%` }}
                  >
                    <div className="font-medium">
                      {date.toLocaleDateString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-gray-500">
                      {date.toLocaleDateString('ja-JP', { weekday: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* チャート本体 */}
          <div className="space-y-0">
            {chartData.map((item) => (
              <div
                key={item.id}
                className="flex border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="w-48 p-3 border-r border-gray-200">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.process_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.assignee || '未割当'}
                  </div>
                </div>

                <div className="flex-1 relative p-2" style={{ height: '60px' }}>
                  {/* 予定期間（背景） */}
                  <div
                    className="absolute top-3 h-4 bg-gray-200 rounded opacity-50"
                    style={{
                      left: `${(item.plannedStartOffset / totalDays) * 100}%`,
                      width: `${(item.plannedDuration / totalDays) * 100}%`,
                    }}
                  />

                  {/* 実際の期間 */}
                  {item.actualStartOffset !== null &&
                    item.actualDuration !== null && (
                      <div
                        className={`absolute top-3 h-4 rounded ${getStatusBadgeColor(item.status).replace('text-', 'text-white ').replace('bg-', 'bg-').split(' ')[0]}`}
                        style={{
                          left: `${(item.actualStartOffset / totalDays) * 100}%`,
                          width: `${(item.actualDuration / totalDays) * 100}%`,
                        }}
                      />
                    )}

                  {/* 進捗ラベル */}
                  <div className="absolute top-6 left-1 text-xs">
                    <span
                      className={`px-1.5 py-0.5 rounded text-white text-xs ${getStatusBadgeColor(item.status).split(' ')[0]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gray-200 rounded"></div>
            <span className="text-gray-600">予定期間</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-600">実績期間</span>
          </div>
        </div>
      </div>
    </div>
  );
}
