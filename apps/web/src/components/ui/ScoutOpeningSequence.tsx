'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrigamiDecoration } from './decorations';
import { Button } from './button';

interface ScoutOpeningSequenceProps {
  onComplete: () => void;
}

export const ScoutOpeningSequence: React.FC<ScoutOpeningSequenceProps> = ({ onComplete }) => {
  const [scene, setScene] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [assetVisible, setAssetVisible] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [showSubQuote, setShowSubQuote] = useState(false);
  const [showEntry, setShowEntry] = useState(false);

  // Timings: Slide transitions and staggered asset fades
  useEffect(() => {
    // Scene 0: Silence (800ms)
    const t0 = setTimeout(() => setScene(1), 800);

    // Scene 1 starts at 800ms. Duration: 3500ms.
    // Fade asset 400ms early at 3900ms.
    const t1Asset = setTimeout(() => setAssetVisible(false), 3900);
    const t1Next = setTimeout(() => {
      setScene(2);
      setAssetVisible(true);
    }, 4300);

    // Scene 2 starts at 4300ms. Duration: 3500ms.
    // Fade asset 400ms early at 7400ms.
    const t2Asset = setTimeout(() => setAssetVisible(false), 7400);
    const t2Next = setTimeout(() => {
      setScene(3);
      setAssetVisible(true);
    }, 7800);

    // Scene 3 starts at 7800ms. Duration: 4200ms.
    // Fade asset 400ms early at 11600ms.
    const t3Asset = setTimeout(() => setAssetVisible(false), 11600);
    const t3Next = setTimeout(() => {
      setScene(4);
      setAssetVisible(true);
    }, 12000);

    // Skip button appears after 2 seconds
    const tSkip = setTimeout(() => setShowSkip(true), 2000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1Asset);
      clearTimeout(t1Next);
      clearTimeout(t2Asset);
      clearTimeout(t2Next);
      clearTimeout(t3Asset);
      clearTimeout(t3Next);
      clearTimeout(tSkip);
    };
  }, []);

  useEffect(() => {
    if (scene === 4) {
      const subTimer = setTimeout(() => setShowSubQuote(true), 800);
      const entryTimer = setTimeout(() => setShowEntry(true), 1500);
      return () => {
        clearTimeout(subTimer);
        clearTimeout(entryTimer);
      };
    }
  }, [scene]);

  // Exact math path coordinates for splines
  const cranePath = 'M -150 250 Q 250 50 500 180 T 1150 150';
  const butterflyPath = 'M 1150 350 Q 750 200 500 280 T -150 250';

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#FAF8F5] select-none flex items-center justify-center">
      {/* Skip button */}
      <AnimatePresence>
        {showSkip && scene < 4 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 0.8, x: 2 }}
            onClick={onComplete}
            className="absolute top-8 right-8 text-xs font-light tracking-widest text-zinc-500 outline-none z-50 py-2 px-3 hover:text-zinc-800 transition-colors font-sans"
          >
            Skip →
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* SCENE 0: Silence */}
        {scene === 0 && (
          <motion.div
            key="scene-0"
            className="absolute inset-0 bg-[#FAF8F5]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* SCENE 1: Not every opportunity... (Background #FAF8F5 Premium Museum Paper) */}
        {scene === 1 && (
          <motion.div
            key="scene-1"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(100% 0 0 0)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#FAF8F5] flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            {/* Trail aligns perfectly with flight path */}
            <div className="absolute inset-0 pointer-events-none">
              <svg
                className="w-full h-full"
                viewBox="0 0 1000 1000"
                fill="none"
                preserveAspectRatio="none"
              >
                <motion.path
                  d={cranePath}
                  stroke="rgba(70,70,70,0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3.0, ease: 'easeInOut' }}
                />
              </svg>
            </div>

            {/* Crane asset - scaled 2x larger (160px), aligned to spline path */}
            <AnimatePresence>
              {assetVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 0.85,
                    offsetDistance: '100%',
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    offsetDistance: { duration: 3.0, ease: 'easeInOut' },
                  }}
                  style={{
                    offsetPath: `path('${cranePath}')`,
                    offsetRotate: 'auto 12deg',
                    filter:
                      'sepia(0.6) saturate(0.8) hue-rotate(15deg) brightness(0.8) contrast(1.1)',
                  }}
                  className="absolute left-0 top-0 pointer-events-none"
                >
                  <OrigamiDecoration name="crane" size={160} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.h1
              initial={{ opacity: 0, transform: 'translate3d(0, 15px, 0)' }}
              animate={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-5xl font-semibold tracking-tight text-[#171717] text-center max-w-xl font-serif pb-20"
            >
              Not every opportunity...
            </motion.h1>
          </motion.div>
        )}

        {/* SCENE 2: ...is visible. (Background #FFF4F6 Milk Pink) */}
        {scene === 2 && (
          <motion.div
            key="scene-2"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(100% 0 0 0)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#FFF4F6] flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            {/* Butterfly asset - scaled 2x larger (120px), aligned to spline path */}
            <AnimatePresence>
              {assetVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 0.9,
                    offsetDistance: '100%',
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    offsetDistance: { duration: 3.0, ease: 'easeInOut' },
                  }}
                  style={{
                    offsetPath: `path('${butterflyPath}')`,
                    offsetRotate: 'auto -6deg',
                    filter:
                      'sepia(0.4) saturate(1.2) hue-rotate(310deg) brightness(0.85) contrast(1.0)',
                  }}
                  className="absolute left-0 top-0 pointer-events-none"
                >
                  <OrigamiDecoration name="butterfly" size={120} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.h1
              initial={{ opacity: 0, transform: 'translate3d(0, 15px, 0)' }}
              animate={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-5xl font-semibold tracking-tight text-[#222222] text-center max-w-2xl font-serif pb-20"
            >
              ...is visible.
            </motion.h1>
          </motion.div>
        )}

        {/* SCENE 3: Some dreams... only need one chance. (Background #FBF7EE Rich Dusty Cream) */}
        {scene === 3 && (
          <motion.div
            key="scene-3"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(100% 0 0 0)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#FBF7EE] flex items-center justify-center p-8 overflow-hidden"
          >
            <div className="flex flex-col items-center justify-center space-y-12 max-w-2xl text-center pb-20">
              {/* Lotus asset - scaled 2x larger (160px) */}
              <AnimatePresence>
                {assetVisible && (
                  <motion.div
                    initial={{ opacity: 0, transform: 'scale(0.96) translate3d(0, 5px, 0)' }}
                    animate={{ opacity: 0.85, transform: 'scale(1) translate3d(0, 0, 0)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      filter:
                        'sepia(0.3) saturate(1.1) hue-rotate(320deg) brightness(0.88) contrast(1.0)',
                    }}
                    className="pointer-events-none"
                  >
                    <OrigamiDecoration name="lotus" size={160} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-3xl md:text-5xl font-semibold tracking-tight text-[#242424] font-serif"
                >
                  Some dreams...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.6 }}
                  className="text-3xl md:text-5xl font-semibold tracking-tight text-[#C59AA7] font-serif"
                >
                  ...only need one chance.
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCENE 4: SCOUT Centered (Background #0B0C0E) */}
        {scene === 4 && (
          <motion.div
            key="scene-4"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#0B0C0E] flex flex-col items-center justify-center p-8 select-none"
          >
            <div className="max-w-xl text-center flex flex-col items-center space-y-10 pb-20">
              <motion.h1
                initial={{ opacity: 0, transform: 'translate3d(0, 15px, 0)' }}
                animate={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-6xl md:text-8xl font-semibold tracking-[0.25em] text-white font-sans"
              >
                SCOUT
              </motion.h1>

              {/* Sub-quote */}
              <div className="h-6">
                <AnimatePresence>
                  {showSubQuote && (
                    <motion.p
                      initial={{ opacity: 0, transform: 'translate3d(0, 4px, 0)' }}
                      animate={{ opacity: 0.4, transform: 'translate3d(0, 0, 0)' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-xs tracking-widest text-white uppercase font-light font-sans"
                    >
                      Opportunity Intelligence for Women
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Enter Button */}
              <div className="h-12 pt-4">
                <AnimatePresence>
                  {showEntry && (
                    <motion.div
                      initial={{ opacity: 0, transform: 'translate3d(0, 8px, 0)' }}
                      animate={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={onComplete}
                        className="px-8 border border-white/20 bg-white/5 text-white hover:bg-white hover:text-black transition-all font-sans"
                      >
                        Enter
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
