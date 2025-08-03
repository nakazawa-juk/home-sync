import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateRange(start: string, end: string): string {
  const startDate = formatDate(start);
  const endDate = formatDate(end);
  return `${startDate} ～ ${endDate}`;
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case '未着手':
      return 'bg-gray-100 text-gray-800';
    case '進行中':
      return 'bg-blue-100 text-blue-800';
    case '完了':
      return 'bg-green-100 text-green-800';
    case '遅延':
      return 'bg-red-100 text-red-800';
    case '中断':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function calculateProgress(scheduleItems: { status: string }[]): number {
  if (scheduleItems.length === 0) return 0;

  const completedItems = scheduleItems.filter((item) => item.status === '完了');
  return Math.round((completedItems.length / scheduleItems.length) * 100);
}
