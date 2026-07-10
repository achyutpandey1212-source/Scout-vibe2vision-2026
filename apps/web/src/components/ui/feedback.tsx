'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react';

// Inline Alert Message
export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  className = '',
  children,
  ...props
}) => {
  const styles: Record<
    AlertVariant,
    { bg: string; border: string; text: string; icon: React.ReactNode }
  > = {
    success: {
      bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
      border: 'border-emerald-500/20 dark:border-emerald-500/30',
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-500/5 dark:bg-amber-500/10',
      border: 'border-amber-500/20 dark:border-amber-500/30',
      text: 'text-amber-800 dark:text-amber-300',
      icon: <TriangleAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    },
    error: {
      bg: 'bg-destructive/5 dark:bg-destructive/10',
      border: 'border-destructive/20 dark:border-destructive/30',
      text: 'text-destructive dark:text-red-300',
      icon: <AlertCircle className="w-5 h-5 text-destructive shrink-0" />,
    },
    info: {
      bg: 'bg-indigo-500/5 dark:bg-indigo-500/10',
      border: 'border-indigo-500/20 dark:border-indigo-500/30',
      text: 'text-indigo-800 dark:text-indigo-300',
      icon: <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
    },
  };

  const { bg, border, text, icon } = styles[variant];

  return (
    <div
      role="alert"
      className={`flex gap-4 p-5 border rounded-2xl ${bg} ${border} ${text} ${className}`}
      {...props}
    >
      {icon}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-medium text-sm leading-none tracking-tight">{title}</h5>}
        <div className="text-xs md:text-sm font-light leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

// Skeleton Placeholder
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-pulse rounded bg-accent/40 dark:bg-accent-foreground/5 ${className}`}
      {...props}
    />
  );
};

// Toast Notification
export interface ToastMessage {
  id: string;
  message: string;
  type?: AlertVariant;
}

export const Toast: React.FC<{
  message: string;
  type?: AlertVariant;
  onClose?: () => void;
  className?: string;
}> = ({ message, type = 'info', onClose, className = '' }) => {
  const typeIcons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    warning: <TriangleAlert className="w-4 h-4 text-amber-500" />,
    error: <AlertCircle className="w-4 h-4 text-destructive" />,
    info: <Info className="w-4 h-4 text-primary" />,
  };

  return (
    <div
      className={`
        inline-flex items-center gap-3 bg-card border border-border/80 px-4 py-3 rounded-full shadow-lg text-xs md:text-sm font-light text-foreground
        ${className}
      `.trim()}
    >
      {typeIcons[type]}
      <span className="flex-1 pr-2">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-secondary/50 hover:text-foreground p-0.5 rounded-full hover:bg-accent/60"
        >
          &times;
        </button>
      )}
    </div>
  );
};

// Honest Loading State (Conversational updates for processes)
interface HonestLoadingProps {
  steps: string[];
  intervalMs?: number;
  onComplete?: () => void;
}

export const HonestLoadingState: React.FC<HonestLoadingProps> = ({
  steps,
  intervalMs = 800,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, intervalMs);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentStep, steps.length, intervalMs, onComplete]);

  return (
    <div className="flex flex-col space-y-4 max-w-sm w-full py-4 text-left select-none">
      {steps.map((step, index) => {
        const isFinished = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div
            key={step}
            className={`
              flex items-center gap-3 text-xs md:text-sm font-light transition-all duration-300
              ${isFinished ? 'text-foreground/80 font-normal' : isCurrent ? 'text-primary' : 'text-secondary/40'}
            `}
          >
            {isFinished ? (
              <svg
                className="w-4 h-4 text-emerald-500 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : isCurrent ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 border border-border rounded-full shrink-0" />
            )}
            <span className="truncate">{step}</span>
          </div>
        );
      })}
    </div>
  );
};
