'use client';

import React from 'react';
import { BackgroundAccent, CornerDecoration } from '../ui/decorations';

interface AppLayoutProps {
  children: React.ReactNode;
  showAccents?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, showAccents = true }) => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 relative flex flex-col justify-between overflow-x-hidden font-sans">
      {showAccents && (
        <>
          <BackgroundAccent />
          <CornerDecoration name="crane" position="top-right" size={130} />
          <CornerDecoration name="butterfly" position="bottom-left" size={110} />
        </>
      )}

      {/* Main page view */}
      <main className="flex-1 flex flex-col relative z-10">{children}</main>
    </div>
  );
};
