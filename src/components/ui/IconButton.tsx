'use client';

import type { ButtonHTMLAttributes } from 'react';

type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, string> = {
  sm: 'h-9 w-9 text-[15px]',
  md: 'h-11 w-11 text-lg',
  lg: 'h-14 w-14 text-2xl',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  active?: boolean;
  label: string;
}

export function IconButton({ size = 'md', active, label, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        'inline-flex items-center justify-center rounded-full transition',
        'text-neutral-600 hover:text-neutral-900 hover:bg-black/5',
        'dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
        'disabled:opacity-40 disabled:pointer-events-none',
        sizes[size],
        active ? 'text-neutral-900 dark:text-white bg-black/5 dark:bg-white/10' : '',
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
