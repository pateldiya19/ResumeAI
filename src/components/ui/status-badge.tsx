import { Badge } from './badge';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'blue' | 'purple' | 'default' }> = {
  pending: { label: 'Pending', variant: 'default' },
  scraping_candidate: { label: 'Scraping', variant: 'blue' },
  scraping_target: { label: 'Scraping', variant: 'blue' },
  parsing_jd: { label: 'Parsing', variant: 'blue' },
  analyzing: { label: 'Analyzing', variant: 'purple' },
  generating: { label: 'Generating', variant: 'purple' },
  complete: { label: 'Complete', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  sent: { label: 'Sent', variant: 'blue' },
  delivered: { label: 'Delivered', variant: 'success' },
  opened: { label: 'Opened', variant: 'purple' },
  clicked: { label: 'Clicked', variant: 'purple' },
  bounced: { label: 'Bounced', variant: 'error' },
  queued: { label: 'Queued', variant: 'default' },
  replied: { label: 'Replied', variant: 'success' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' as const };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
