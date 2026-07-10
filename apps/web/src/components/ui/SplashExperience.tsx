'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrigamiDecoration } from './decorations';
import { fadeVariants } from './motion';

interface SplashExperienceProps {
  onComplete: () => void;
}

interface SplashStep {
  bgClass: string;
  textClass: string;
  quote: string;
  assetName: 'crane' | 'butterfly' | 'lotus' | 'star';
}

const splashSteps: SplashStep[] = [
  {
    bgClass: 'bg-[#FFFFFF] dark:bg-[#121318]',
    textClass: 'text-[#18181B] dark:text-[#E4E4E7]',
    quote: 'Not every opportunity is visible.',
    assetName: 'crane',
  },
  {
    bgClass: 'bg-[#E8A2AF] dark:bg-[#9B4D5B]',
    textClass: 'text-[#FFFFFF] dark:text-[#FFF5F5]',
    quote: 'Some are simply waiting for someone to notice them.',
    assetName: 'butterfly',
  },
  {
    bgClass: 'bg-[#FAF6EE] dark:bg-[#1E1C18]',
    textClass: 'text-[#18181B] dark:text-[#EADEC9]',
    quote: "Every woman deserves to discover what's possible.",
    assetName: 'lotus',
  },
  {
    bgClass: 'bg-[#0F1117] dark:bg-[#08090C]',
    textClass: 'text-[#FAFAFA] dark:text-[#E4E4E7]',
    quote: 'Welcome to Scout.',
    assetName: 'star',
  },
];

export const SplashExperience: React.FC<SplashExperienceProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < splashSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 1300); // 1.3 seconds per step
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500); // Wait 1.5 seconds on final welcome before entry
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  const step = splashSteps[currentStep];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-8 transition-colors duration-700 ease-in-out ${step.bgClass}`}
    >
      {/* Paper Wash slide panel animation effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl text-center space-y-10 flex flex-col items-center"
        >
          {/* Drifting Origami Graphic */}
          <div className="opacity-90">
            <OrigamiDecoration
              name={step.assetName}
              size={90}
              floating
              floatingOffset={8}
              floatingDuration={4}
            />
          </div>

          {/* Editorial Quote */}
          <h1
            className={`text-2xl md:text-4xl font-light tracking-tight leading-relaxed max-w-lg ${step.textClass}`}
          >
            {step.quote}
          </h1>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
