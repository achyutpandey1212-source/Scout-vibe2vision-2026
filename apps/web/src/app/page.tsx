'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between p-8 md:p-16 overflow-hidden">
      {/* Decorative subtle origami background grid/shapes */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04] flex items-center justify-center">
        <svg
          width="800"
          height="800"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
        >
          {/* Origami Crane geometric paths */}
          <path d="M50 10 L25 45 L50 85 L75 45 Z" />
          <path d="M25 45 L50 45 L50 85 Z" />
          <path d="M75 45 L50 45 L50 85 Z" />
          <path d="M50 10 L50 45" />
          <path d="M10 30 L25 45 L50 45" />
          <path d="M90 30 L75 45 L50 45" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center space-x-3"
        >
          {/* Minimalist Scout Origami-style Logo */}
          <svg
            className="w-8 h-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-xl font-medium tracking-tight font-sans">Scout</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <ThemeToggle />
        </motion.div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 my-auto max-w-4xl mx-auto text-center flex flex-col items-center justify-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* Subtle micro-badge representing Quiet Intelligence */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-secondary/90 tracking-wide uppercase font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Opportunity Intelligence Engine</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-light tracking-tight text-foreground leading-[1.1] pt-2">
            Opportunities found <br />
            <span className="font-normal text-primary">while you sleep.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="text-base md:text-xl text-secondary max-w-xl font-light leading-relaxed"
        >
          Scout continuously searches, matches, and customizes recommendations tailored to you. No
          search bars, no filters, no clutter. Just direct matches.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="pt-6"
        >
          {/* Highly premium premium CTA placeholder */}
          <div className="relative group select-none">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/40 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <button className="relative px-8 py-3.5 bg-card text-foreground border border-border rounded-full hover:bg-accent text-sm font-medium tracking-tight transition-all duration-200">
              Entering Phase 1
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full flex items-center justify-between text-xs text-secondary/60">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          © {new Date().getFullYear()} Scout. All rights reserved.
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="tracking-widest uppercase text-[10px]"
        >
          ZenKai Ecosystem
        </motion.span>
      </footer>
    </div>
  );
}
