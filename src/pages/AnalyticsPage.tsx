import { useState, useCallback } from 'react';
import { BarChart3, Download } from 'lucide-react';
import {
  DateRangeSelector,
  MetricsCards,
  TokenUsageChart,
  ModelDistributionChart,
  DailyActivityChart,
} from '../components/analytics';
import { useAnalytics } from '../hooks/useAnalytics';
import { getDefaultDateRange } from '../lib/analytics';
import type { DateRange, DailyStats } from '../types';
import { getDailyStats } from '../lib/db';

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDefaultDateRange(30));
  const { stats, isLoading } = useAnalytics(dateRange);

  const handleExportStats = useCallback(async () => {
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];
    const dailyStats = await getDailyStats(startStr, endStr);

    if (dailyStats.length === 0) return;

    const csvContent = statsToCSV(dailyStats);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-stats-${startStr}-to-${endStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dateRange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={24} className="text-violet-500" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Analytics
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Insights into your Claude usage patterns
          </p>
        </div>
        <button
          onClick={handleExportStats}
          disabled={!stats || stats.dailyData.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="mb-6">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      <div className="space-y-6">
        <MetricsCards stats={stats} isLoading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TokenUsageChart stats={stats} isLoading={isLoading} />
          <ModelDistributionChart stats={stats} isLoading={isLoading} />
        </div>

        <DailyActivityChart stats={stats} isLoading={isLoading} />
      </div>
    </div>
  );
}

function statsToCSV(dailyStats: DailyStats[]): string {
  const headers = [
    'Date',
    'Input Tokens',
    'Output Tokens',
    'Total Tokens',
    'Messages',
    'Artifacts',
    'Tool Uses',
    'Model Usage',
  ];

  const rows = dailyStats.map((day) => [
    day.date,
    day.inputTokens,
    day.outputTokens,
    day.inputTokens + day.outputTokens,
    day.messageCount,
    day.artifactCount,
    day.toolUseCount,
    Object.entries(day.modelUsage)
      .map(([model, count]) => `${model}:${count}`)
      .join('; '),
  ]);

  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
}
