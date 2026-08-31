import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'rounded-md border border-border bg-surface px-3 py-2 text-sm',
        className,
      )}
      {...props}
    />
  );
}
