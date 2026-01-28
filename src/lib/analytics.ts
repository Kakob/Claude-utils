import type { DailyStats, DateRange } from '../types';

export interface AggregatedStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalMessages: number;
  totalArtifacts: number;
  totalToolUses: number;
  uniqueDays: number;
  avgTokensPerDay: number;
  avgMessagesPerDay: number;
  modelUsage: Record<string, number>;
  dailyData: {
    date: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    messages: number;
    artifacts: number;
    toolUses: number;
  }[];
}

export function aggregateStats(dailyStats: DailyStats[]): AggregatedStats {
  const result: AggregatedStats = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalMessages: 0,
    totalArtifacts: 0,
    totalToolUses: 0,
    uniqueDays: dailyStats.length,
    avgTokensPerDay: 0,
    avgMessagesPerDay: 0,
    modelUsage: {},
    dailyData: [],
  };

  for (const day of dailyStats) {
    result.totalInputTokens += day.inputTokens;
    result.totalOutputTokens += day.outputTokens;
    result.totalMessages += day.messageCount;
    result.totalArtifacts += day.artifactCount;
    result.totalToolUses += day.toolUseCount;

    for (const [model, count] of Object.entries(day.modelUsage)) {
      result.modelUsage[model] = (result.modelUsage[model] ?? 0) + count;
    }

    result.dailyData.push({
      date: day.date,
      inputTokens: day.inputTokens,
      outputTokens: day.outputTokens,
      totalTokens: day.inputTokens + day.outputTokens,
      messages: day.messageCount,
      artifacts: day.artifactCount,
      toolUses: day.toolUseCount,
    });
  }

  result.totalTokens = result.totalInputTokens + result.totalOutputTokens;

  if (result.uniqueDays > 0) {
    result.avgTokensPerDay = Math.round(result.totalTokens / result.uniqueDays);
    result.avgMessagesPerDay = Math.round(result.totalMessages / result.uniqueDays);
  }

  // Sort daily data by date
  result.dailyData.sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

export function getDateRangeString(range: DateRange): { start: string; end: string } {
  return {
    start: range.start.toISOString().split('T')[0],
    end: range.end.toISOString().split('T')[0],
  };
}

export function getDefaultDateRange(days: number): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}
