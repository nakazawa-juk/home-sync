'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { ProjectStatus } from '@/lib/types';

interface ProjectFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  search: string;
  status: ProjectStatus[];
  company: string;
  showFilters: boolean;
}

const statusOptions: ProjectStatus[] = [
  '未着手',
  '進行中',
  '完了',
  '遅延',
  '中断',
];

export function ProjectFilters({ onFilterChange }: ProjectFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    company: '',
    showFilters: false,
  });

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusToggle = (status: ProjectStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCompanyChange = (value: string) => {
    const newFilters = { ...filters, company: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      search: '',
      status: [],
      company: '',
      showFilters: false,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters =
    filters.search || filters.status.length > 0 || filters.company;

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="プロジェクト名、場所、会社名で検索..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                showFilters: !prev.showFilters,
              }))
            }
          >
            <Filter className="h-4 w-4 mr-2" />
            フィルター
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              クリア
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {filters.showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    filters.status.includes(status)
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              施工会社
            </label>
            <input
              type="text"
              placeholder="施工会社名で絞り込み..."
              value={filters.company}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
