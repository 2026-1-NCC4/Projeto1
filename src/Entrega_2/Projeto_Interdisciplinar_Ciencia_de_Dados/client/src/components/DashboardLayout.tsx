import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}
        `}
      >
        <Sidebar
          collapsed={!sidebarOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-x-hidden">
          <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-5 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}