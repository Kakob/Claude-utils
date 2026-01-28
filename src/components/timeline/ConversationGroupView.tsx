import { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { TimelineItem } from './TimelineItem';
import { TokenDisplay } from './TokenDisplay';
import type { ConversationGroup } from '../../types';

interface ConversationGroupViewProps {
  group: ConversationGroup;
}

export function ConversationGroupView({ group }: ConversationGroupViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const timeRange = formatTimeRange(group.firstActivity, group.lastActivity);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
          <MessageSquare size={18} className="text-violet-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {group.conversationTitle || 'Untitled Conversation'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {group.activityCount} activities • {timeRange}
          </p>
        </div>

        <div className="flex-shrink-0">
          <TokenDisplay tokens={group.totalTokens} />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-4 space-y-3">
          {group.activities.map((activity) => (
            <TimelineItem key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeRange(start: Date, end: Date): string {
  const startDate = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endDate = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} - ${endDate}`;
}
