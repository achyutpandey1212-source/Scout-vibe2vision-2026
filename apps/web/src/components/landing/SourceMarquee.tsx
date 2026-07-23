'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LogoItem {
  name: string;
  src: string;
  className: string;
}

const LOGO_SOURCES: LogoItem[] = [
  { name: 'Amazon', src: '/Sources/Amazon.svg', className: 'h-8 sm:h-9' },
  { name: 'GitHub', src: '/Sources/Github.svg', className: 'h-6 sm:h-7' },
  { name: 'Glassdoor', src: '/Sources/Glassdoor.svg', className: 'h-8 sm:h-9' },
  { name: 'Google', src: '/Sources/Google.svg', className: 'h-6 sm:h-7' },
  { name: 'ISRO', src: '/Sources/ISRO.svg', className: 'h-6 sm:h-7' },
  { name: 'Indeed', src: '/Sources/Indeed.svg', className: 'h-8 sm:h-9' },
  { name: 'Internshala', src: '/Sources/Internshala.svg', className: 'h-6 sm:h-7' },
  { name: 'LinkedIn', src: '/Sources/Linkedin.svg', className: 'h-8 sm:h-9' },
  { name: 'Microsoft', src: '/Sources/Microsoft.svg', className: 'h-6 sm:h-7' },
  { name: 'Nvidia', src: '/Sources/Nvidia.svg', className: 'h-6 sm:h-7' },
  { name: 'Unstop', src: '/Sources/Unstop.svg', className: 'h-6 sm:h-7' },
  { name: 'Wellfound', src: '/Sources/Wellfound.svg', className: 'h-6 sm:h-7' },
  { name: 'Y Combinator', src: '/Sources/Ycombinator.svg', className: 'h-10 sm:h-12' },
];

export const SourceMarquee: React.FC = () => {
  // Duplicate array 3 times for seamless endless loop
  const marqueeLogos = [...LOGO_SOURCES, ...LOGO_SOURCES, ...LOGO_SOURCES];

  return (
    <div className="w-full py-12 bg-card/40 border-y border-border/40 overflow-hidden select-none space-y-6 pointer-events-none">
      <div className="text-center space-y-1">
        <p className="text-xs uppercase font-medium tracking-widest text-primary">
          Opportunity Sources
        </p>
        <p className="text-sm text-muted-foreground font-light">
          Discovering opportunities from across the web
        </p>
      </div>

      {/* Infinite Linear Scrolling Track */}
      <div className="relative w-full overflow-hidden flex items-center">
        {/* Left & Right Gradient Mask Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          animate={{ x: ['0%', '-33.333%'] }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: 35,
            ease: 'linear',
          }}
          className="flex items-center gap-12 sm:gap-16 whitespace-nowrap min-w-max pointer-events-none"
        >
          {marqueeLogos.map((logo, idx) => (
            <div
              key={`${logo.name}-${idx}`}
              className="flex items-center justify-center shrink-0 h-12 px-3"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className={`w-auto object-contain pointer-events-none select-none ${logo.className}`}
              />
            </div>
          ))}
        </motion.div>
      </div>

      <p className="text-[11px] text-center text-muted-foreground/60 max-w-xl mx-auto px-4 font-light leading-relaxed">
        Scout is an independent opportunity discovery platform and is not affiliated with or
        endorsed by these organizations. All trademarks belong to their respective owners.
      </p>
    </div>
  );
};

export default SourceMarquee;
