'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FolderOpen,
  Upload,
  Settings,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: 'プロジェクト', href: '/projects', icon: FolderOpen },
  { name: 'PDFインポート', href: '/import', icon: Upload },
  { name: '設定', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-3 text-xl font-semibold text-gray-900">
              HomeSync
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive
                        ? 'text-blue-500'
                        : 'text-gray-400 group-hover:text-gray-500',
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-6 border-t border-gray-200">
            <div className="text-xs text-gray-500">© 2024 HomeSync</div>
          </div>
        </div>
      </div>
    </>
  );
}
