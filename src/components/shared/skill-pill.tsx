'use client';

import { cn } from '@/lib/cn';

interface SkillPillProps {
  skill: string;
  variant: 'matched' | 'missing' | 'neutral';
}

const variants = {
  matched: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  missing: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  neutral: 'bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20',
};

export function SkillPill({ skill, variant }: SkillPillProps) {
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-medium', variants[variant])}>
      {skill}
    </span>
  );
}
