import { cn } from '@/lib/cn';

const planConfig: Record<string, { label: string; className: string }> = {
  free: { label: 'FREE', className: 'bg-gray-100 text-gray-600' },
  pro: { label: 'PRO', className: 'bg-gradient-to-r from-brand-600 to-brand-500 text-white' },
  enterprise: { label: 'ENTERPRISE', className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' },
};

interface PlanBadgeProps {
  plan: string;
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const config = planConfig[plan] || planConfig.free;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
