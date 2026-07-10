'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrigamiDecoration } from './decorations';
import { fadeVariants } from './motion';

interface UniversalLoaderProps {
  messages: string[];
  intervalMs?: number;
  onComplete?: () => void;
}

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  messages,
  intervalMs = 1200,
  onComplete,
}) => {
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);

  useEffect(() => {
    if (currentMessageIdx < messages.length - 1) {
      const timer = setTimeout(() => {
        setCurrentMessageIdx((prev) => prev + 1);
      }, intervalMs);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, intervalMs);
      return () => clearTimeout(timer);
    }
  }, [currentMessageIdx, messages.length, intervalMs, onComplete]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center select-none space-y-8 max-w-md mx-auto">
      {/* Drifting crane graphic */}
      <div className="opacity-80 dark:opacity-60 scale-110">
        <OrigamiDecoration
          name="crane"
          size={110}
          floating
          floatingOffset={8}
          floatingDuration={5}
        />
      </div>

      {/* Sequential honest status messages */}
      <div className="h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIdx}
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-sm font-light text-secondary tracking-wide"
          >
            {messages[currentMessageIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
