'use client';

/**
 * ==========================================
 *        UNIVERSAL EDITORIAL FOOTER
 * ==========================================
 * Reusable editorial footer across authenticated & unauthenticated views.
 */

import React from 'react';
import Link from 'next/link';
import { Brand } from '../common/Brand';
import { ROUTES } from '@/lib/constants/routes';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border/60 bg-card/30 text-foreground py-12 md:py-16 select-none relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Upper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand & Mission Column (6 cols) */}
          <div className="md:col-span-6 space-y-3">
            <Brand size="md" href={ROUTES.HOME} />
            <p className="text-xs text-muted-foreground font-light leading-relaxed max-w-sm">
              Helping students discover opportunities they would&apos;ve otherwise missed.
            </p>
          </div>

          {/* Resources Column (3 cols) */}
          <div className="md:col-span-3 space-y-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 block">
              Resources
            </span>
            <ul className="space-y-2 text-xs text-muted-foreground font-light">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Scout
                </Link>
              </li>
              <li>
                <a
                  href="https://chat.whatsapp.com/G3E6G6X2B9y3X3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Connect Column (3 cols) */}
          <div className="md:col-span-3 space-y-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 block">
              Connect
            </span>
            <ul className="space-y-2 text-xs text-muted-foreground font-light">
              <li>
                <a
                  href="https://www.linkedin.com/in/achyut-pandey-6593b4256"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://chat.whatsapp.com/G3E6G6X2B9y3X3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  WhatsApp Group
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer Row */}
        <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground/70 font-light">
          <p>© {new Date().getFullYear()} Scout. Built independently for students.</p>
          <p className="text-[10px] text-muted-foreground/50">
            Not affiliated with third-party organizations whose opportunities are indexed.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
