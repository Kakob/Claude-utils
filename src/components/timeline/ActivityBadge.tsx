import {
  MessageSquare,
  MessageCircle,
  FileText,
  Code,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import type { ActivityType } from '../../types';
import { activityLabels } from './activityUtils';

interface ActivityBadgeProps {
  type: ActivityType;
  size?: 'sm' | 'md';
}

const activityConfig: Record<
  ActivityType,
  { icon: typeof MessageSquare; color: string; bg: string }
> = {
  message_sent: {
    icon: MessageSquare,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  message_received: {
    icon: MessageCircle,
    color: 'text-violet-500',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
  },
  artifact_created: {
    icon: FileText,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  code_block: {
    icon: Code,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  tool_use: {
    icon: Wrench,
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  tool_result: {
    icon: CheckCircle,
    color: 'text-teal-500',
    bg: 'bg-teal-100 dark:bg-teal-900/30',
  },
};

export function ActivityBadge({ type, size = 'md' }: ActivityBadgeProps) {
  const config = activityConfig[type];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 14 : 18;
  const padding = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <div
      className={`${config.bg} ${padding} rounded-lg`}
      title={activityLabels[type]}
    >
      <Icon size={iconSize} className={config.color} />
    </div>
  );
}
