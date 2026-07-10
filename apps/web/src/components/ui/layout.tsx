import React from 'react';
import { tokens } from '@/lib/design-tokens';

interface BaseLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Container: React.FC<
  BaseLayoutProps & { size?: 'sm' | 'md' | 'lg' | 'xl' | 'wide' }
> = ({ size = 'xl', className = '', children, ...props }) => {
  const maxWidths = {
    sm: 'max-w-[640px]',
    md: 'max-w-[768px]',
    lg: 'max-w-[1024px]',
    xl: 'max-w-[1280px]',
    wide: 'max-w-[1440px]',
  };

  return (
    <div className={`w-full mx-auto px-4 md:px-8 ${maxWidths[size]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Section: React.FC<BaseLayoutProps & { size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const paddings = {
    sm: 'py-6 md:py-10',
    md: 'py-12 md:py-20',
    lg: 'py-20 md:py-32',
  };

  return (
    <section className={`${paddings[size]} ${className}`} {...props}>
      {children}
    </section>
  );
};

export const PageWrapper: React.FC<BaseLayoutProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`min-h-screen flex flex-col bg-background text-foreground relative overflow-x-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface StackProps extends BaseLayoutProps {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  gap?: keyof typeof tokens.spacing | 'none';
  wrap?: boolean;
}

export const Stack: React.FC<StackProps> = ({
  direction = 'col',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  wrap = false,
  className = '',
  children,
  ...props
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse',
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const gapClasses = {
    none: 'gap-0',
    xxs: 'gap-1', // 4px
    xs: 'gap-2', // 8px
    sm: 'gap-3', // 12px
    md: 'gap-4', // 16px
    lg: 'gap-6', // 24px
    xl: 'gap-8', // 32px
    xxl: 'gap-12', // 48px
    xxxl: 'gap-16', // 64px
  };

  return (
    <div
      className={`flex ${directionClasses[direction]} ${alignClasses[align]} ${
        justifyClasses[justify]
      } ${gapClasses[gap]} ${wrap ? 'flex-wrap' : 'flex-nowrap'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface GridProps extends BaseLayoutProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  colsSm?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: keyof typeof tokens.spacing | 'none';
}

export const Grid: React.FC<GridProps> = ({
  cols = 1,
  colsSm,
  colsMd,
  colsLg,
  gap = 'md',
  className = '',
  children,
  ...props
}) => {
  const colMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const colSmMap = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
    12: 'sm:grid-cols-12',
  };

  const colMdMap = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    12: 'md:grid-cols-12',
  };

  const colLgMap = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    12: 'lg:grid-cols-12',
  };

  const gapClasses = {
    none: 'gap-0',
    xxs: 'gap-1',
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    xxl: 'gap-12',
    xxxl: 'gap-16',
  };

  return (
    <div
      className={`grid ${colMap[cols]} ${colsSm ? colSmMap[colsSm] : ''} ${
        colsMd ? colMdMap[colsMd] : ''
      } ${colsLg ? colLgMap[colsLg] : ''} ${gapClasses[gap]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const Spacer: React.FC<{ size?: keyof typeof tokens.spacing; axis?: 'x' | 'y' }> = ({
  size = 'md',
  axis = 'y',
}) => {
  const dimensions = {
    xxs: axis === 'y' ? 'h-1 w-full' : 'w-1 h-full',
    xs: axis === 'y' ? 'h-2 w-full' : 'w-2 h-full',
    sm: axis === 'y' ? 'h-3 w-full' : 'w-3 h-full',
    md: axis === 'y' ? 'h-4 w-full' : 'w-4 h-full',
    lg: axis === 'y' ? 'h-6 w-full' : 'w-6 h-full',
    xl: axis === 'y' ? 'h-8 w-full' : 'w-8 h-full',
    xxl: axis === 'y' ? 'h-12 w-full' : 'w-12 h-full',
    xxxl: axis === 'y' ? 'h-16 w-full' : 'w-16 h-full',
  };

  return <div className={`${dimensions[size]} shrink-0`} aria-hidden="true" />;
};

export const Divider: React.FC<BaseLayoutProps & { label?: string }> = ({
  label,
  className = '',
  ...props
}) => {
  if (label) {
    return (
      <div className={`w-full flex items-center gap-4 py-4 ${className}`} {...props}>
        <div className="flex-grow h-[1px] bg-border" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary/60 select-none">
          {label}
        </span>
        <div className="flex-grow h-[1px] bg-border" />
      </div>
    );
  }

  return <div className={`w-full h-[1px] bg-border my-4 ${className}`} {...props} />;
};
