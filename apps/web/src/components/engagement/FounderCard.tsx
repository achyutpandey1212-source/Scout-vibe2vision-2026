'use client';

/**
 * ==========================================
 *           FOUNDER CARD ENGAGEMENT
 * ==========================================
 * Personal, non-intrusive floating card connecting users with the creator.
 * Appears exclusively on the Landing Page after 15s with a 6-hour cooldown.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { track } from '@/lib/analytics';
import { X, Linkedin, MessageCircle, Heart } from 'lucide-react';

const COOLDOWN_KEY = 'scout_founder_card_last_interaction';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export const FounderCard: React.FC = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const shownTimeRef = useRef<number>(0);

  const dismissCard = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    }
    if (shownTimeRef.current > 0) {
      track('founder_card_closed', {
        page: '/',
        time_visible_ms: Date.now() - shownTimeRef.current,
      });
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    // 1. Founder card appears ONLY on the landing page ('/')
    if (pathname !== '/') {
      setVisible(false);
      return;
    }

    // 2. Check 6-hour cooldown persistence
    if (typeof window !== 'undefined') {
      const lastInteraction = localStorage.getItem(COOLDOWN_KEY);
      if (lastInteraction) {
        const timeElapsed = Date.now() - Number(lastInteraction);
        if (timeElapsed < SIX_HOURS_MS) {
          return; // Suppressed during 6-hour cooldown
        }
      }
    }

    // 3. Trigger: 15-Second Time Threshold on Landing Page
    const timer = setTimeout(() => {
      setVisible(true);
      shownTimeRef.current = Date.now();
      track('founder_card_shown', {
        trigger: 'timer',
        page: '/',
        authenticated: Boolean(user),
        session_age_seconds: 15,
      });
    }, 15000);

    // Cleanup on route change or unmount
    return () => {
      clearTimeout(timer);
    };
  }, [pathname, user]);

  // Esc key dismiss listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        dismissCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, dismissCard]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:max-w-sm w-auto animate-in fade-in slide-in-from-bottom-5 duration-300 select-none">
      <div className="relative bg-card/95 backdrop-blur-md border border-border/80 rounded-3xl p-5 shadow-2xl space-y-4 text-foreground">
        {/* Close Button */}
        <button
          onClick={dismissCard}
          className="absolute right-4 top-4 text-muted-foreground/70 hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Founder Header */}
        <div className="flex items-center gap-3.5 pr-6">
          <img
            src="/Founder card/founder.webp"
            alt="Achyut Pandey"
            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
          />
          <div>
            <h3 className="text-base font-display font-medium leading-tight">
              Hi, I&apos;m Achyut.
            </h3>
            <p className="text-[11px] text-muted-foreground font-light">Founder | Scout</p>
          </div>
        </div>

        {/* Bio Copy */}
        <div className="text-xs text-muted-foreground font-light leading-relaxed space-y-2 border-t border-border/40 pt-3">
          <p>
            I&apos;m a third-year engineering student who got tired of searching 15 different
            websites every day for internships, hackathons and fellowships.
          </p>
          <p>So I started building Scout.</p>
          <p className="text-foreground/90">
            If something feels confusing, if you find a bug, or if you simply want to say
            hi—I&apos;d genuinely love to hear from you.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <a
              href="https://www.linkedin.com/in/achyut-pandey-122a87323/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track('founder_card_connect_clicked', { destination: 'linkedin' });
                dismissCard();
              }}
              className="flex-1 py-2 px-3 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-xs flex items-center justify-center gap-1.5"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://chat.whatsapp.com/KA7o5Z40G1f6z1mas8hx41"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track('founder_card_connect_clicked', { destination: 'whatsapp' });
                dismissCard();
              }}
              className="flex-1 py-2 px-3 bg-card border border-border/80 text-foreground text-xs font-medium rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Community</span>
            </a>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://github.com/achyutpandey1212"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track('founder_card_volunteer_clicked', { page: '/' });
                dismissCard();
              }}
              className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <Heart className="text-rose-500 fill-rose-500 w-3 h-3" />
              <span>Contribute</span>
            </a>
            <button
              onClick={dismissCard}
              className="text-[11px] text-muted-foreground/70 hover:text-foreground font-light"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FounderCard;
