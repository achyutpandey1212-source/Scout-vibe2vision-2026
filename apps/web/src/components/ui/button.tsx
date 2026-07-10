'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { pressAnimation } from './motion';

export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'outline' | 'text' | 'danger' | 'success';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  square?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  square = false,
  className = '',
  children,
  onClick,
  ...props
}) => {
  // Styles mapping matching the premium warm-off-white and lotus theme colors
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-primary text-primary-foreground hover:opacity-95 focus:ring-primary/40 active:opacity-90',
    secondary:
      'bg-card text-foreground border border-border/80 hover:bg-accent/40 focus:ring-border/40',
    ghost:
      'bg-transparent text-foreground hover:bg-accent/40 hover:text-foreground focus:ring-accent/40',
    outline:
      'bg-transparent text-foreground border border-border hover:bg-accent/30 focus:ring-primary/20',
    text: 'bg-transparent text-secondary hover:text-foreground underline-offset-4 hover:underline p-0 focus:ring-transparent',
    danger: 'bg-destructive text-destructive-foreground hover:opacity-95 focus:ring-destructive/30',
    success: 'bg-emerald-600 text-white hover:opacity-95 focus:ring-emerald-600/30',
  };

  const sizeStyles = {
    sm: square ? 'p-2' : 'px-4 py-2 text-xs',
    md: square ? 'p-2.5' : 'px-6 py-2.5 text-sm',
    lg: square ? 'p-3.5' : 'px-8 py-3.5 text-base',
  };

  const baseClasses =
    'relative inline-flex items-center justify-center font-medium rounded-full outline-none focus:ring-2 focus:ring-offset-2 transition-colors select-none';
  const disabledClasses = 'opacity-40 cursor-not-allowed pointer-events-none';
  const loadingClasses = 'cursor-wait pointer-events-none';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      whileTap={disabled || loading ? undefined : pressAnimation.tap}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses} 
        ${variantStyles[variant]} 
        ${sizeStyles[size]} 
        ${disabled ? disabledClasses : ''} 
        ${loading ? loadingClasses : ''} 
        ${className}
      `.trim()}
      {...props}
    >
      {loading && (
        <span className="absolute flex items-center justify-center">
          <svg
            className="animate-spin h-4 h-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      <span
        className={`inline-flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}
      >
        {iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>}
        {children}
        {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
      </span>
    </motion.button>
  );
};
