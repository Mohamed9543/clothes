import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'rounded-full bg-brand-terracotta text-white hover:opacity-90 disabled:opacity-50',
  outline: 'rounded-md border border-border hover:border-brand-gold disabled:opacity-50',
  ghost: 'rounded-md hover:bg-surface disabled:opacity-50',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-6 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn('font-medium', VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...props}
    />
  );
}
