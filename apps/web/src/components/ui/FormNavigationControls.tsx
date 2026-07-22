'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from './button';

export interface FormNavigationControlsProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export const FormNavigationControls: React.FC<FormNavigationControlsProps> = ({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel,
  isFirstStep = false,
  isLastStep = false,
  isLoading = false,
  isDisabled = false,
  className = '',
}) => {
  const defaultNextLabel = isLastStep ? 'Finish' : 'Continue';
  const labelToDisplay = nextLabel || defaultNextLabel;

  return (
    <div className={`w-full flex items-center justify-between gap-4 pt-4 ${className}`}>
      {/* Back Button */}
      {!isFirstStep && onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onBack}
          disabled={isLoading}
          iconLeft={<ArrowLeft className="w-4 h-4" />}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {backLabel}
        </Button>
      ) : (
        <div />
      )}

      {/* Primary Continue / Finish Action Button */}
      {onNext && (
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onNext}
          loading={isLoading}
          disabled={isDisabled || isLoading}
          iconRight={
            isLastStep ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />
          }
          className="px-6 text-sm"
        >
          {labelToDisplay}
        </Button>
      )}
    </div>
  );
};

export default FormNavigationControls;
