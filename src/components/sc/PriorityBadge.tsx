import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { PriorityLevel } from '@/lib/sitecommand-utils';
import { getPriorityBg } from '@/lib/sitecommand-utils';

interface PriorityBadgeProps {
  priority: PriorityLevel | string | null | undefined;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm', showIcon = true }) => {
  const p: PriorityLevel =
    priority === 'high' || priority === 'medium' || priority === 'low'
      ? (priority as PriorityLevel)
      : 'low';

  const icons: Record<PriorityLevel, React.ElementType> = {
    high: AlertTriangle,
    medium: AlertCircle,
    low: CheckCircle2,
  };

  const Icon = icons[p];
  const labels: Record<PriorityLevel, string> = { high: 'High', medium: 'Medium', low: 'Low' };

  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full font-semibold capitalize ${getPriorityBg(p)} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      {showIcon && Icon ? <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> : null}
      {labels[p]}
    </span>
  );
};

export default PriorityBadge;
