'use client';

import React, { useId } from 'react';
import { Search, X } from 'lucide-react';

// Form Control helpers
export const FormLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <label
    className={`block text-xs font-semibold uppercase tracking-wider text-secondary/80 select-none ${className}`}
    {...props}
  >
    {children}
  </label>
);

export const HelperText: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-xs font-light text-secondary/60 mt-1.5 ${className}`} {...props}>
    {children}
  </p>
);

export const ValidationMessage: React.FC<
  React.HTMLAttributes<HTMLParagraphElement> & { type?: 'error' | 'success' }
> = ({ type = 'error', className = '', children, ...props }) => {
  const typeClasses = type === 'error' ? 'text-destructive' : 'text-emerald-600';
  return (
    <p
      className={`text-xs font-medium mt-1.5 flex items-center gap-1 ${typeClasses} ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

// Text Input Component
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, helperText, error, icon, className = '', id, type = 'text', ...props }, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && <FormLabel htmlFor={inputId}>{label}</FormLabel>}
        <div className="relative w-full flex items-center">
          {icon && (
            <span className="absolute left-4 text-secondary/50 pointer-events-none select-none">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`
              w-full text-sm font-light bg-card border rounded-xl min-h-[44px] px-4 py-2.5 outline-none transition-all duration-150
              ${icon ? 'pl-11' : 'pl-4'}
              ${error ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20'}
              placeholder:text-muted-foreground/50 text-foreground
              disabled:opacity-40 disabled:cursor-not-allowed
              ${className}
            `.trim()}
            {...props}
          />
        </div>
        {error ? (
          <ValidationMessage type="error">{error}</ValidationMessage>
        ) : (
          helperText && <HelperText>{helperText}</HelperText>
        )}
      </div>
    );
  },
);
TextInput.displayName = 'TextInput';

// Search Input Component
interface SearchInputProps extends Omit<TextInputProps, 'icon'> {
  onClear?: () => void;
  value?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value = '', className = '', ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-secondary/40 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          className={`
            w-full text-sm font-light bg-card/60 border border-border/80 rounded-full pl-11 pr-10 py-3 outline-none transition-all duration-200
            focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10 placeholder-secondary/40 text-foreground
            ${className}
          `.trim()}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3.5 p-1 rounded-full text-secondary/50 hover:bg-accent/50 hover:text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const defaultId = useId();
    const textareaId = id || defaultId;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && <FormLabel htmlFor={textareaId}>{label}</FormLabel>}
        <textarea
          id={textareaId}
          ref={ref}
          className={`
            w-full text-sm font-light bg-card border border-border/80 rounded-2xl p-5 outline-none transition-all duration-200 min-h-[100px]
            ${error ? 'border-destructive focus:ring-destructive/20' : 'focus:border-primary focus:ring-primary/20'}
            focus:ring-4 placeholder-secondary/40 text-foreground
            disabled:opacity-40 disabled:cursor-not-allowed
            ${className}
          `.trim()}
          {...props}
        />
        {error ? (
          <ValidationMessage type="error">{error}</ValidationMessage>
        ) : (
          helperText && <HelperText>{helperText}</HelperText>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

// Switch Component
interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className = '', id, checked, ...props }, ref) => {
    const defaultId = useId();
    const switchId = id || defaultId;

    return (
      <label
        htmlFor={switchId}
        className="inline-flex items-center gap-3 cursor-pointer select-none"
      >
        <div className="relative">
          <input
            id={switchId}
            ref={ref}
            type="checkbox"
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div className="w-11 h-6 bg-accent border border-border rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
        </div>
        {label && <span className="text-sm font-light text-foreground">{label}</span>}
      </label>
    );
  },
);
Switch.displayName = 'Switch';

// Checkbox Component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const defaultId = useId();
    const checkboxId = id || defaultId;

    return (
      <label
        htmlFor={checkboxId}
        className="inline-flex items-center gap-2.5 cursor-pointer select-none"
      >
        <input
          id={checkboxId}
          ref={ref}
          type="checkbox"
          className={`
            w-4 h-4 rounded text-primary border-border bg-card outline-none focus:ring-4 focus:ring-primary/10 transition duration-200
            ${className}
          `.trim()}
          {...props}
        />
        {label && <span className="text-sm font-light text-foreground">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

// Radio Button Component
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, name, ...props }, ref) => {
    const defaultId = useId();
    const radioId = id || defaultId;

    return (
      <label
        htmlFor={radioId}
        className="inline-flex items-center gap-2.5 cursor-pointer select-none"
      >
        <input
          id={radioId}
          ref={ref}
          name={name}
          type="radio"
          className={`
            w-4 h-4 text-primary border-border bg-card outline-none focus:ring-4 focus:ring-primary/10 transition duration-200
            ${className}
          `.trim()}
          {...props}
        />
        {label && <span className="text-sm font-light text-foreground">{label}</span>}
      </label>
    );
  },
);
Radio.displayName = 'Radio';

// Select Wrapper Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, className = '', id, children, ...props }, ref) => {
    const defaultId = useId();
    const selectId = id || defaultId;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && <FormLabel htmlFor={selectId}>{label}</FormLabel>}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`
              w-full text-sm font-light bg-card border border-border/80 rounded-xl min-h-[44px] px-4 py-2.5 outline-none appearance-none transition-all duration-150
              ${error ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'focus:border-primary focus:ring-2 focus:ring-primary/20'}
              text-foreground
              disabled:opacity-40 disabled:cursor-not-allowed
              ${className}
            `.trim()}
            {...props}
          >
            {children}
          </select>
          {/* Custom Chevron Down Arrow */}
          <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-secondary/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error ? (
          <ValidationMessage type="error">{error}</ValidationMessage>
        ) : (
          helperText && <HelperText>{helperText}</HelperText>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';

// Chip / Tag component
export const Chip: React.FC<{
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}> = ({ label, selected = false, onClick, onRemove, className = '' }) => {
  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-light tracking-wide transition-all duration-200 select-none
        ${onClick ? 'cursor-pointer' : ''}
        ${
          selected
            ? 'bg-primary/10 border-primary/40 text-primary font-medium'
            : 'bg-card border-border text-secondary/80 hover:bg-accent/40'
        }
        ${className}
      `.trim()}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
};

// Slider Primitive component
interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ label, className = '', id, min = 0, max = 100, ...props }, ref) => {
    const defaultId = useId();
    const sliderId = id || defaultId;

    return (
      <div className="w-full flex flex-col space-y-2">
        {label && <FormLabel htmlFor={sliderId}>{label}</FormLabel>}
        <input
          id={sliderId}
          ref={ref}
          type="range"
          min={min}
          max={max}
          className={`
            w-full h-1.5 bg-accent border-none rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none
            ${className}
          `.trim()}
          {...props}
        />
      </div>
    );
  },
);
Slider.displayName = 'Slider';

// Progress Step indicators
export const ProgressStep: React.FC<{
  steps: string[];
  currentStep: number;
  className?: string;
}> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`w-full flex items-center justify-between gap-2.5 ${className}`}>
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;

        return (
          <React.Fragment key={step}>
            {/* Step circle */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300 border
                  ${
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground font-semibold scale-110 shadow-sm'
                      : isCompleted
                        ? 'bg-primary/20 border-primary/20 text-primary font-medium'
                        : 'bg-card border-border text-secondary/40'
                  }
                `}
              >
                {idx + 1}
              </div>
            </div>
            {/* Connection line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] bg-accent relative rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                  style={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
