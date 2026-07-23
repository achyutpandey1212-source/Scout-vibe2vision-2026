'use client';

/**
 * ==========================================
 *          SIDEBAR LAYOUT REFINEMENT
 * ==========================================
 * Refined authenticated application sidebar
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Compass, Bookmark } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { Brand } from '../common/Brand';
import { useAuth } from '@/context/auth-context';
import { profileApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants/routes';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Discover', href: ROUTES.EXPLORE, icon: Compass },
  { label: 'Saved', href: ROUTES.BOOKMARKS, icon: Bookmark },
];

const getInitialProfileName = () => {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('scout_v2_profile_name');
    if (cached) return cached;
  }
  return '';
};

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string>(getInitialProfileName);

  useEffect(() => {
    profileApi
      .getV2()
      .then((res) => {
        if (res.data?.success && res.data.data.profile?.fullName) {
          const name = res.data.data.profile.fullName.trim();
          setProfileName(name);
          localStorage.setItem('scout_v2_profile_name', name);
        }
      })
      .catch(() => {});
  }, []);

  const userName = profileName || user?.displayName || user?.name || 'Student';
  const userPicture = user?.picture;
  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside
      className="hidden md:flex flex-col w-[260px] h-screen sticky top-0 shrink-0 border-r border-border/80 bg-background/95 backdrop-blur select-none z-30 transition-colors duration-200"
      aria-label="Primary navigation"
    >
      {/* ── Brand Logo Header ── */}
      <div className="h-20 px-6 flex items-center border-b border-border/40">
        <Brand size="md" href={ROUTES.DASHBOARD} />
      </div>

      {/* ── Primary Navigation (Middle) ── */}
      <div className="flex-1 px-4 py-8 space-y-2">
        <div className="px-3.5 mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-primary/10 border border-primary/20 text-primary font-semibold shadow-xs'
                  : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground/70'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Footer: Profile Shortcut & Theme Switcher ── */}
      <div className="p-4 pb-6 border-t border-border/50 flex items-center justify-between gap-3">
        <Link
          href={ROUTES.PROFILE}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 flex-1 min-w-0 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary border border-transparent hover:border-border/40"
          title="View profile settings"
        >
          {userPicture ? (
            <img
              src={userPicture}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs shrink-0">
              {initial}
            </div>
          )}
          <div className="flex flex-col truncate">
            <span className="text-xs font-medium text-foreground truncate">{userName}</span>
            <span className="text-[10px] text-muted-foreground truncate">View profile</span>
          </div>
        </Link>

        {/* Theme Toggle */}
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};
