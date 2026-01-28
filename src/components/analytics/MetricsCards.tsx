import { Zap, MessageSquare, FileText, Wrench } from 'lucide-react';
import type { AggregatedStats } from '../../lib/analytics';

interface MetricsCardsProps {
  stats: AggregatedStats | null;
  isLoading: boolean;
}

export function MetricsCards({ stats, isLoading }: MetricsCardsProps) {
  const cards = [
    {
      label: 'Total Tokens',
      value: formatNumber(stats?.totalTokens ?? 0),
      subvalue: `${formatNumber(stats?.totalInputTokens ?? 0)} in / ${formatNumber(stats?.totalOutputTokens ?? 0)} out`,
      icon: Zap,
      color: 'text-violet-500',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: 'Messages',
      value: formatNumber(stats?.totalMessages ?? 0),
      subvalue: `~${stats?.avgMessagesPerDay ?? 0}/day`,
      icon: MessageSquare,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Artifacts',
      value: formatNumber(stats?.totalArtifacts ?? 0),
      subvalue: 'Created',
      icon: FileText,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'Tool Uses',
      value: formatNumber(stats?.totalToolUses ?? 0),
      subvalue: 'Invocations',
      icon: Wrench,
      color: 'text-orange-500',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
        >
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon size={18} className={card.color} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {card.label}
                </span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {card.value}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {card.subvalue}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}
