'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { Brand } from '../common/Brand';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants/routes';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onSearchClick?: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    subtitle: 'Daily curated opportunity intelligence',
  },
  [ROUTES.EXPLORE]: {
    title: 'Discover',
    subtitle: 'Browse every opportunity in Scout live index',
  },
  [ROUTES.BOOKMARKS]: {
    title: 'Saved',
    subtitle: 'Opportunities saved for application',
  },
  [ROUTES.PROFILE]: {
    title: 'Profile',
    subtitle: 'Manage your profile and opportunity preferences',
  },
  [ROUTES.NOTIFICATIONS]: {
    title: 'Notifications',
    subtitle: 'Alerts and updates stream',
  },
};

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, onSearchClick }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const routeInfo = ROUTE_TITLES[pathname] || {
    title: title || 'Scout',
    subtitle,
  };

  const currentTitle = title || routeInfo.title;
  const currentSubtitle = subtitle !== undefined ? subtitle : routeInfo.subtitle;

  const userName = user?.name || 'Scout User';
  const userPicture = user?.picture;

  return (
    <header className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-md border-b border-border/60 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Brand Logo or Desktop Page Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Logo Mark */}
          <div className="md:hidden flex items-center pr-2">
            <Brand size="sm" showWordmark={true} href={ROUTES.DASHBOARD} />
          </div>

          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-display font-medium text-foreground tracking-tight">
              {currentTitle}
            </h1>
            {currentSubtitle && (
              <p className="text-xs text-muted-foreground font-light hidden sm:block">
                {currentSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions (Search, Theme Toggle, Profile Avatar) */}
        <div className="flex items-center gap-2 md:gap-3">
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Search opportunities"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden md:inline-block text-[10px] bg-card border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Theme Switcher for mobile or quick desktop access */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
