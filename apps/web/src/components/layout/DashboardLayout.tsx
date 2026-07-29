'use client';

import React from 'react';
import { AppLayout } from './AppLayout';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { Container } from '../ui/layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <AppLayout showAccents={false}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Desktop Fixed Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Top Bar Header */}
          <TopBar title={title} subtitle={subtitle} />

          {/* Main Page View Container */}
          <main className="flex-1 w-full pb-24 md:pb-12">
            <Container size="wide">{children}</Container>
          </main>

          {/* Universal Editorial Footer */}
          <Footer />
        </div>

        {/* Mobile Dedicated Bottom Navigation */}
        <MobileNav />
      </div>
    </AppLayout>
  );
};
