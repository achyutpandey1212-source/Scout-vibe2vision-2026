'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { X, Search, Check, ChevronDown } from 'lucide-react';
import { FormLabel, HelperText, ValidationMessage } from './input';

export interface MultiSelectOption {
  label: string;
  value: string;
}

export interface MultiSelectProps {
  label?: string;
  helperText?: string;
  error?: string;
  options?: (string | MultiSelectOption)[];
  value?: string[];
  onChange?: (selected: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  helperText,
  error,
  options = [],
  value = [],
  onChange,
  placeholder = 'Type or select options...',
  allowCustom = true,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Normalize options to { label, value }
  const normalizedOptions: MultiSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );

  // Filter options based on query and unselected state
  const filteredOptions = normalizedOptions.filter(
    (opt) =>
      !value.includes(opt.value) && opt.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOption = (val: string) => {
    if (!value.includes(val)) {
      const next = [...value, val];
      if (onChange) onChange(next);
    }
    setQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeOption = (val: string) => {
    const next = value.filter((v) => v !== val);
    if (onChange) onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        selectOption(filteredOptions[highlightedIndex].value);
      } else if (allowCustom && query.trim() !== '') {
        selectOption(query.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
      removeOption(value[value.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className={`w-full flex flex-col space-y-1.5 relative ${className}`}>
      {label && <FormLabel htmlFor={inputId}>{label}</FormLabel>}

      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`
          w-full text-sm font-light bg-card border rounded-xl min-h-[44px] p-2.5 flex flex-wrap items-center gap-2 transition-all duration-150 cursor-text
          ${error ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/20' : 'border-border/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'}
        `}
      >
        {/* Render selected pills */}
        {value.map((val) => {
          const opt = normalizedOptions.find((o) => o.value === val);
          const displayLabel = opt ? opt.label : val;
          return (
            <span
              key={val}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 select-none"
            >
              <span>{displayLabel}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(val);
                }}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                aria-label={`Remove ${displayLabel}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        {/* Input box */}
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 text-foreground p-0"
        />

        <ChevronDown className="w-4 h-4 text-muted-foreground/50 ml-auto shrink-0 pointer-events-none" />
      </div>

      {/* Dropdown Options */}
      {isOpen && filteredOptions.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-card border border-border/80 rounded-xl shadow-lg z-50 py-1 space-y-0.5 text-sm"
        >
          {filteredOptions.map((opt, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isHighlighted}
                onClick={(e) => {
                  e.stopPropagation();
                  selectOption(opt.value);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`
                  px-4 py-2 cursor-pointer flex items-center justify-between transition-colors
                  ${isHighlighted ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted/50'}
                `}
              >
                <span>{opt.label}</span>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <ValidationMessage type="error">{error}</ValidationMessage>
      ) : (
        helperText && <HelperText>{helperText}</HelperText>
      )}
    </div>
  );
};

export default MultiSelect;
