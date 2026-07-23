'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  Cpu,
  Layers,
  HardDrive,
  Database,
  ScrollText,
  Settings,
  LogOut,
  Boxes,
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Discovery Engine', path: '/admin/discovery', icon: Cpu },
  { label: 'Recommendation Engine', path: '/admin/recommendation', icon: Layers },
  { label: 'Providers', path: '/admin/providers', icon: Boxes },
  { label: 'Jobs & Scheduler', path: '/admin/jobs', icon: HardDrive },
  { label: 'Database', path: '/admin/database', icon: Database },
  { label: 'Logs', path: '/admin/logs', icon: ScrollText },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Skip sidebar rendering on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${apiHost}/api/v1/admin/logout`, {}, { withCredentials: true });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex font-sans">
      {/* 1. Sidebar Panel */}
      <aside className="w-64 border-r border-neutral-900 flex flex-col justify-between p-6 bg-neutral-950 shrink-0">
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-400 uppercase">
              Scout Operations
            </h2>
            <p className="text-neutral-600 text-xs mt-0.5">Control Center V1</p>
          </div>

          <nav className="space-y-1.5">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-neutral-50 font-medium'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded text-sm text-neutral-600 hover:text-red-400 hover:bg-red-950/20 transition-colors w-full cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Operations</span>
        </button>
      </aside>

      {/* 2. Main Content viewport */}
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
        <header className="h-14 border-b border-neutral-900 flex items-center justify-between px-8 bg-neutral-950/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 text-sm font-medium">Operations Center</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-neutral-600 text-xs font-mono">system.healthy</span>
          </div>
          <div className="text-neutral-600 text-xs font-mono">v2.0.0-prod</div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
