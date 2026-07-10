import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps & { hoverable?: boolean }> = ({
  hoverable = false,
  className = '',
  children,
  ...props
}) => {
  const hoverStyles = hoverable
    ? 'hover:shadow-md hover:-translate-y-[2px] transition-all duration-300 cursor-pointer'
    : '';

  return (
    <div
      className={`bg-card text-card-foreground rounded-3xl border border-border/80 shadow-sm overflow-hidden ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`p-6 md:p-8 flex flex-col space-y-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps & { component?: React.ElementType }> = ({
  component: Component = 'h3',
  className = '',
  children,
  ...props
}) => {
  return (
    <Component
      className={`text-lg md:text-xl font-normal tracking-tight text-foreground ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardDescription: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <p className={`text-xs md:text-sm font-light text-secondary/70 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`px-6 pb-6 md:px-8 md:pb-8 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`px-6 py-4 md:px-8 md:py-6 bg-accent/10 border-t border-border/40 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
