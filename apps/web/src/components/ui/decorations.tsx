'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type OrigamiAsset =
  | 'blooming_seed'
  | 'bookmark_with_star'
  | 'butterfly'
  | 'compass'
  | 'constellation'
  | 'crane'
  | 'envelope'
  | 'envelope_2'
  | 'flower_petals'
  | 'lotus'
  | 'mountain'
  | 'paper_airplane'
  | 'ribbon_with_sparkles'
  | 'sparkle'
  | 'star'
  | 'career_growth_bird'
  | 'dreams_bird'
  | 'freedom_bird';

interface OrigamiProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: OrigamiAsset;
  size?: number | string;
  floating?: boolean;
  floatingOffset?: number;
  floatingDuration?: number;
}

export const OrigamiDecoration: React.FC<OrigamiProps> = ({
  name,
  size = 64,
  floating = false,
  floatingOffset = 6,
  floatingDuration = 4,
  className = '',
  style,
  alt = 'Origami Asset',
  ...props
}) => {
  // Map names to public assets paths
  const getAssetPath = (assetName: OrigamiAsset): string => {
    const birds = ['career_growth_bird', 'dreams_bird', 'freedom_bird'];
    if (birds.includes(assetName)) {
      return `/assets/Birds/${assetName}.webp`;
    }
    return `/assets/${assetName}.webp`;
  };

  const imgPath = getAssetPath(name);

  const content = (
    <img
      src={imgPath}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        ...style,
      }}
      className={`object-contain pointer-events-none select-none opacity-85 dark:opacity-75 ${className}`}
      {...props}
    />
  );

  if (floating) {
    return (
      <motion.div
        animate={{
          transform: [
            'translate3d(0, 0px, 0)',
            `translate3d(0, -${floatingOffset}px, 0)`,
            'translate3d(0, 0px, 0)',
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: floatingDuration,
          ease: 'easeInOut',
        }}
        className="inline-block shrink-0"
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

// Corner assets container helper
export const CornerDecoration: React.FC<{
  name: OrigamiAsset;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number;
  className?: string;
}> = ({ name, position = 'top-right', size = 120, className = '' }) => {
  const positioning = {
    'top-left': 'top-0 left-0 -translate-x-1/4 -translate-y-1/4',
    'top-right': 'top-0 right-0 translate-x-1/4 -translate-y-1/4',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4',
    'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/4',
  };

  return (
    <div
      className={`absolute pointer-events-none select-none z-0 opacity-15 dark:opacity-[0.08] ${positioning[position]} ${className}`}
    >
      <OrigamiDecoration
        name={name}
        size={size}
        floating
        floatingOffset={10}
        floatingDuration={6}
      />
    </div>
  );
};

// Subtle background accent wraps
export const BackgroundAccent: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 ${className}`}
    >
      {/* Delicate floating shapes */}
      <div className="absolute top-1/4 left-10 opacity-10">
        <OrigamiDecoration
          name="butterfly"
          size={90}
          floating
          floatingOffset={8}
          floatingDuration={5}
        />
      </div>
      <div className="absolute top-1/3 right-12 opacity-[0.07]">
        <OrigamiDecoration
          name="crane"
          size={140}
          floating
          floatingOffset={12}
          floatingDuration={7}
        />
      </div>
      <div className="absolute bottom-1/4 left-1/4 opacity-[0.05]">
        <OrigamiDecoration
          name="compass"
          size={160}
          floating
          floatingOffset={5}
          floatingDuration={8}
        />
      </div>
    </div>
  );
};
