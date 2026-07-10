'use client';

import React, { useState } from 'react';
import { Menu, X, Bell, User, Search } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { Button } from './button';
import { Drawer } from './modal';
import { tokens } from '@/lib/design-tokens';

interface NavProps {
  userName?: string;
  userPicture?: string;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  isAuthenticated?: boolean;
}

export const TopNavigation: React.FC<NavProps> = ({
  userName = 'Scout User',
  userPicture,
  onSearchClick,
  onNotificationsClick,
  onProfileClick,
  isAuthenticated = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Saved', href: '/bookmarks' },
    { label: 'Notifications', href: '/notifications' },
  ];

  return (
    <header
      className="sticky top-0 w-full border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors duration-200"
      style={{ zIndex: tokens.zIndex.header }}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2.5 outline-none select-none group">
            <svg
              className="w-7 h-7 text-primary transition-transform duration-300 group-hover:rotate-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-lg font-medium tracking-tight font-sans">Scout</span>
          </a>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-xs font-medium tracking-wide uppercase text-secondary/80 hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {/* Right Side: Interactive Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mock Search trigger bar */}
          {isAuthenticated && (
            <button
              onClick={onSearchClick}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-accent/20 text-secondary/60 hover:bg-accent/40 text-xs font-light transition-all duration-200 outline-none"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search opportunities...</span>
              <kbd className="text-[10px] bg-card border border-border px-1.5 py-0.5 rounded ml-2">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Notifications Button */}
          {isAuthenticated && (
            <button
              onClick={onNotificationsClick}
              className="relative p-2 text-secondary/70 hover:text-foreground hover:bg-accent/50 rounded-full transition-colors outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="View alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </button>
          )}

          {/* Profile Avatar Component */}
          {isAuthenticated && (
            <button
              onClick={onProfileClick}
              className="flex items-center gap-2 p-1 border border-border hover:border-primary/40 rounded-full bg-card transition-all outline-none"
              aria-label="User profile settings"
            >
              {userPicture ? (
                <img
                  src={userPicture}
                  alt={userName}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs">
                  {userName.charAt(0)}
                </div>
              )}
            </button>
          )}

          {/* Mobile Hamburguer Toggle */}
          {isAuthenticated && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex md:hidden p-2 text-secondary/80 hover:bg-accent/60 rounded-full outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Visual presentational helper) */}
      <Drawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} title="Menu">
        <nav className="flex flex-col space-y-4 pt-4">
          {navigationItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-light text-foreground/80 hover:text-primary py-2 border-b border-border/40 transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-6 flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              {userPicture ? (
                <img src={userPicture} alt={userName} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                  {userName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-secondary">Signed in with Google</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onProfileClick) onProfileClick();
              }}
            >
              View Profile
            </Button>
          </div>
        </nav>
      </Drawer>
    </header>
  );
};
