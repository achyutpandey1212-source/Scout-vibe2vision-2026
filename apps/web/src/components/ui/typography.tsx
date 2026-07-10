import React from 'react';

export type TypographyVariant =
  | 'display'
  | 'hero'
  | 'heading-xl'
  | 'heading-l'
  | 'heading-m'
  | 'heading-s'
  | 'body-large'
  | 'body'
  | 'caption'
  | 'label'
  | 'button'
  | 'code';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  component?: React.ElementType;
  children: React.ReactNode;
}

const variantStyles: Record<TypographyVariant, string> = {
  display:
    'text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-foreground leading-[1.1]',
  hero: 'text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-tight',
  'heading-xl': 'text-2xl md:text-4xl font-normal tracking-tight text-foreground leading-snug',
  'heading-l': 'text-xl md:text-3xl font-normal tracking-tight text-foreground leading-snug',
  'heading-m': 'text-lg md:text-2xl font-medium tracking-tight text-foreground leading-normal',
  'heading-s': 'text-base md:text-xl font-medium text-foreground leading-normal',
  'body-large': 'text-base md:text-lg font-light text-foreground/90 leading-relaxed',
  body: 'text-sm md:text-base font-light text-foreground/80 leading-relaxed',
  caption: 'text-xs md:text-sm font-light text-secondary/70 leading-normal',
  label: 'text-xs font-semibold tracking-wider uppercase text-secondary/80',
  button: 'text-sm font-medium tracking-wide',
  code: 'font-mono text-xs md:text-sm bg-accent/30 px-1.5 py-0.5 rounded border border-border/40 font-light',
};

const defaultComponentMap: Record<TypographyVariant, React.ElementType> = {
  display: 'h1',
  hero: 'h1',
  'heading-xl': 'h2',
  'heading-l': 'h3',
  'heading-m': 'h4',
  'heading-s': 'h5',
  'body-large': 'p',
  body: 'p',
  caption: 'span',
  label: 'span',
  button: 'span',
  code: 'code',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  component,
  className = '',
  children,
  ...props
}) => {
  const Component = component || defaultComponentMap[variant];
  const combinedStyles = `${variantStyles[variant]} ${className}`.trim();

  return (
    <Component className={combinedStyles} {...props}>
      {children}
    </Component>
  );
};
