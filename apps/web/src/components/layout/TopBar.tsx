'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
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

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const routeInfo = ROUTE_TITLES[pathname] || {
    title: title || 'Scout',
    subtitle,
  };

  const currentTitle = title || routeInfo.title;
  const currentSubtitle = subtitle !== undefined ? subtitle : routeInfo.subtitle;

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

        {/* Right: Actions (Notifications, Theme Toggle) */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-border/60 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Notifications - Coming soon"
              title="Notifications - Coming soon."
            >
              <Bell className="w-4 h-4" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-card border border-border shadow-lg rounded-xl p-4 z-50">
                <h3 className="font-medium text-sm mb-2 text-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  This feature is currently under development.
                </p>
                <p className="text-xs text-foreground mb-2">Scout will notify you about:</p>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1 mb-3">
                  <li>New matching opportunities</li>
                  <li>Upcoming deadlines</li>
                  <li>Saved opportunity reminders</li>
                  <li>New recommendations</li>
                </ul>
                <p className="text-xs font-medium text-primary">Coming soon.</p>
              </div>
            )}
          </div>

          {/* Theme Switcher for mobile or quick desktop access */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
