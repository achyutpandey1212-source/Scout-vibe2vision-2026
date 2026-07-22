'use client';

import React from 'react';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  className = '',
}) => {
  const percentage = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

  return (
    <div className={`w-full space-y-2 select-none ${className}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground font-light">
        <span className="font-mono tracking-tight">
          Step {currentStep} of {totalSteps}
        </span>
        {stepTitle && (
          <span className="font-medium text-foreground text-[11px] uppercase tracking-wider">
            {stepTitle}
          </span>
        )}
      </div>

      <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;
