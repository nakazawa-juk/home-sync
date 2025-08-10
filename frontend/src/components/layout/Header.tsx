'use client';

import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'ダッシュボード', subtitle }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title section */}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>

          {/* Actions section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="検索..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User menu */}
            <Button variant="ghost" size="sm">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
