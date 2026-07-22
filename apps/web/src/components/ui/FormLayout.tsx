'use client';

import React from 'react';

export interface FormLayoutProps {
  heading: string;
  subheading?: string;
  stepIndicator?: React.ReactNode;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  className?: string;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  heading,
  subheading,
  stepIndicator,
  children,
  footerActions,
  className = '',
}) => {
  return (
    <div
      className={`w-full max-w-[580px] mx-auto px-4 py-8 sm:py-12 space-y-8 select-none ${className}`}
    >
      {/* Top Header & Step Progress */}
      <div className="space-y-4">
        {stepIndicator && <div className="mb-2">{stepIndicator}</div>}

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-foreground tracking-tight leading-tight">
            {heading}
          </h1>
          {subheading && (
            <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
              {subheading}
            </p>
          )}
        </div>
      </div>

      {/* Main Form Body */}
      <div className="space-y-6">{children}</div>

      {/* Footer Actions */}
      {footerActions && <div className="pt-4 border-t border-border/40">{footerActions}</div>}
    </div>
  );
};

export default FormLayout;
