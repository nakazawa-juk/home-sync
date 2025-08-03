import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header title={title} subtitle={subtitle} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
