'use client';

import React from 'react';
import { AppLayout } from './AppLayout';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { Container } from '../ui/layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, subtitle }) => {
  const handleSearchClick = () => {
    // Simulated Search trigger
    const event = new CustomEvent('scout-search-trigger');
    window.dispatchEvent(event);
  };

  return (
    <AppLayout showAccents={false}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Desktop Fixed Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Top Bar Header */}
          <TopBar title={title} subtitle={subtitle} onSearchClick={handleSearchClick} />

          {/* Main Page View Container */}
          <main className="flex-1 w-full pb-24 md:pb-12">
            <Container size="wide">{children}</Container>
          </main>

          {/* Editorial Footer */}
          <footer className="w-full border-t border-border/60 py-6 bg-card/30 text-center text-xs text-muted-foreground relative z-10 hidden md:block">
            <Container
              size="wide"
              className="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <span>© {new Date().getFullYear()} Scout. All rights reserved.</span>
              <span className="tracking-widest uppercase text-[10px] text-muted-foreground/60 font-sans">
                Scout Opportunity Intelligence
              </span>
            </Container>
          </footer>
        </div>

        {/* Mobile Dedicated Bottom Navigation */}
        <MobileNav />
      </div>
    </AppLayout>
  );
};
