import { useState, useEffect, useCallback } from 'react';
import { getDailyStats } from '../lib/db';
import { aggregateStats, getDateRangeString, type AggregatedStats } from '../lib/analytics';
import type { DateRange } from '../types';

interface UseAnalyticsResult {
  stats: AggregatedStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useAnalytics(dateRange: DateRange): UseAnalyticsResult {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRangeString(dateRange);
      const dailyStats = await getDailyStats(start, end);
      const aggregated = aggregateStats(dailyStats);
      setStats(aggregated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
