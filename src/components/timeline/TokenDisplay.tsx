import { Zap } from 'lucide-react';
import type { TokenUsage } from '../../types';

interface TokenDisplayProps {
  tokens: TokenUsage | null;
  showBreakdown?: boolean;
}

export function TokenDisplay({ tokens, showBreakdown = false }: TokenDisplayProps) {
  if (!tokens) {
    return null;
  }

  const total = tokens.inputTokens + tokens.outputTokens;

  if (!showBreakdown) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Zap size={12} />
        <span>{formatTokens(total)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <Zap size={12} />
        <span>{formatTokens(total)} total</span>
      </div>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <span>In: {formatTokens(tokens.inputTokens)}</span>
      <span>Out: {formatTokens(tokens.outputTokens)}</span>
      {tokens.cacheReadTokens !== undefined && tokens.cacheReadTokens > 0 && (
        <>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-green-600 dark:text-green-400">
            Cache: {formatTokens(tokens.cacheReadTokens)}
          </span>
        </>
      )}
    </div>
  );
}

function formatTokens(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
