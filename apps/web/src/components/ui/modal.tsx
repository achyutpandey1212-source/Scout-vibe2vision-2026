'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { fadeVariants, modalVariants, drawerVariants, bottomSheetVariants } from './motion';
import { tokens } from '@/lib/design-tokens';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export const Dialog: React.FC<ModalProps & { size?: 'sm' | 'md' | 'lg' }> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
}) => {
  // Prevent body scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-[440px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[800px]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: tokens.zIndex.modal }}
        >
          {/* Backdrop overlay */}
          <motion.div
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-[2px]"
          />

          {/* Dialog Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            className={`
              relative w-full bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-xl outline-none
              ${sizeClasses[size]}
            `}
          >
            {/* Header layout */}
            <div className="flex items-center justify-between mb-4 gap-4">
              {title ? (
                <h2 className="text-lg md:text-xl font-normal text-foreground tracking-tight">
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-secondary/60 hover:bg-accent/50 hover:text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inner Content scrollable if too long */}
            <div className="max-h-[70vh] overflow-y-auto font-light text-foreground/80 leading-relaxed pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const Drawer: React.FC<ModalProps & { position?: 'right' | 'bottom' }> = ({
  isOpen,
  onClose,
  title,
  position = 'right',
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isRight = position === 'right';
  const motionVariants = isRight ? drawerVariants : bottomSheetVariants;

  const containerClasses = isRight
    ? 'fixed top-0 right-0 h-full w-full max-w-[460px] border-l border-border/80 p-6 md:p-8 flex flex-col shadow-2xl'
    : 'fixed bottom-0 left-0 w-full max-h-[85vh] border-t border-border/80 p-6 rounded-t-[32px] flex flex-col shadow-2xl';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex" style={{ zIndex: tokens.zIndex.drawer }}>
          {/* Backdrop overlay */}
          <motion.div
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-[2px]"
          />

          {/* Drawer Wrapper */}
          <motion.div
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            className={`relative bg-card text-foreground ${containerClasses}`}
          >
            {/* Grab handle/bar for Bottom Sheets */}
            {!isRight && <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 shrink-0" />}

            {/* Header layout */}
            <div className="flex items-center justify-between mb-6 gap-4 shrink-0">
              {title ? (
                <h2 className="text-lg md:text-xl font-normal text-foreground tracking-tight">
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-secondary/60 hover:bg-accent hover:text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto font-light text-foreground/80 leading-relaxed pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
