import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ActivityBadge } from './ActivityBadge';
import { ActivityDetailModal } from './ActivityDetailModal';
import { getActivityLabel } from './activityUtils';
import { TokenDisplay } from './TokenDisplay';
import type { StoredActivity } from '../../types';

interface TimelineItemProps {
  activity: StoredActivity;
}

export function TimelineItem({ activity }: TimelineItemProps) {
  const [showDetail, setShowDetail] = useState(false);
  const time = formatTime(activity.timestamp);
  const date = formatDate(activity.timestamp);

  const hasDetail = activity.metadata.fullContent || activity.metadata.userMessage || activity.metadata.codeContent;

  return (
    <>
      <div
        className={`flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors ${hasDetail ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetail && setShowDetail(true)}
      >
        <ActivityBadge type={activity.type} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {getActivityLabel(activity.type)}
            </span>
            {activity.model && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                {activity.model}
              </span>
            )}
          </div>

          {activity.conversationTitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
              {activity.conversationTitle}
            </p>
          )}

          {renderMetadata(activity)}

          <TokenDisplay tokens={activity.tokens} />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            <div>{time}</div>
            <div className="text-gray-400 dark:text-gray-500">{date}</div>
          </div>
          {hasDetail && (
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>

      {showDetail && (
        <ActivityDetailModal
          activity={activity}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

function renderMetadata(activity: StoredActivity) {
  const { metadata } = activity;

  if (metadata.messagePreview) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
        {metadata.messagePreview}
      </p>
    );
  }

  if (metadata.artifactTitle) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        <span className="font-medium">{metadata.artifactTitle}</span>
        {metadata.artifactType && (
          <span className="text-gray-400 dark:text-gray-500"> ({metadata.artifactType})</span>
        )}
      </p>
    );
  }

  if (metadata.codeLanguage) {
    const preview = metadata.codeContent?.slice(0, 100);
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        <span className="font-mono">{metadata.codeLanguage}</span>
        {preview && (
          <pre className="mt-1 text-xs truncate bg-gray-50 dark:bg-gray-800 p-1 rounded">
            {preview}{metadata.codeContent && metadata.codeContent.length > 100 ? '...' : ''}
          </pre>
        )}
      </div>
    );
  }

  if (metadata.toolName) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        Tool: <span className="font-mono">{metadata.toolName}</span>
      </p>
    );
  }

  return null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
