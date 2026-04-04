'use client';

import { cn } from '@/lib/cn';

interface VerdictBadgeProps {
  verdict: string;
  size?: 'sm' | 'md' | 'lg';
}

function getVariant(verdict: string): 'success' | 'warning' | 'danger' {
  const v = verdict.toLowerCase();
  if (v.includes('strong') || v.includes('good')) return 'success';
  if (v.includes('moderate') || v.includes('good')) return 'warning';
  return 'danger';
}

const variantStyles = {
  success: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-red-100 text-red-700 ring-1 ring-red-200',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5 font-semibold',
};

export function VerdictBadge({ verdict, size = 'md' }: VerdictBadgeProps) {
  // More specific matching
  let variant: 'success' | 'warning' | 'danger';
  const v = verdict.toLowerCase();
  if (v === 'strong' || v === 'strong fit') {
    variant = 'success';
  } else if (v === 'good' || v === 'moderate fit') {
    variant = 'warning';
  } else {
    variant = 'danger';
  }

  return (
    <span className={cn('rounded-full font-medium inline-flex items-center', variantStyles[variant], sizeStyles[size])}>
      {verdict}
    </span>
  );
}
