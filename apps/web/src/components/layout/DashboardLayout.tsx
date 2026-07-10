'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from './AppLayout';
import { TopNavigation } from '../ui/nav';
import { Container } from '../ui/layout';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants/routes';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleNotificationsClick = () => {
    router.push(ROUTES.NOTIFICATIONS);
  };

  const handleProfileClick = () => {
    router.push(ROUTES.PROFILE);
  };

  const handleSearchClick = () => {
    // Simulated Search trigger
    const event = new CustomEvent('scout-search-trigger');
    window.dispatchEvent(event);
  };

  return (
    <AppLayout showAccents={true}>
      <TopNavigation
        userName={user?.name || 'Maya Sharma'}
        userPicture={user?.picture || undefined}
        isAuthenticated={!!user}
        onNotificationsClick={handleNotificationsClick}
        onProfileClick={handleProfileClick}
        onSearchClick={handleSearchClick}
      />

      {/* Page Content Container */}
      <div className="flex-1 w-full py-8 md:py-12">
        <Container size="xl">{children}</Container>
      </div>

      {/* Editorial Footer */}
      <footer className="w-full border-t border-border/80 py-8 bg-card/40 text-center text-xs text-secondary/60 relative z-10">
        <Container
          size="xl"
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <span>© {new Date().getFullYear()} Scout. All rights reserved.</span>
          <span className="tracking-widest uppercase text-[10px]">ZenKai Ecosystem</span>
        </Container>
      </footer>
    </AppLayout>
  );
};
