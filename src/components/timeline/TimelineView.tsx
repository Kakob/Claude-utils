import { TimelineItem } from './TimelineItem';
import { ConversationGroupView } from './ConversationGroupView';
import type { StoredActivity, ConversationGroup } from '../../types';
import { Clock, Inbox } from 'lucide-react';

interface TimelineViewProps {
  activities: StoredActivity[];
  groups: ConversationGroup[];
  groupByConversation: boolean;
  isLoading: boolean;
}

export function TimelineView({
  activities,
  groups,
  groupByConversation,
  isLoading,
}: TimelineViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <Inbox size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">No activities yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Install the Chrome extension to start tracking your Claude usage
        </p>
      </div>
    );
  }

  if (groupByConversation) {
    return (
      <div className="space-y-3">
        {groups.map((group) => (
          <ConversationGroupView key={group.conversationId || 'no-id'} group={group} />
        ))}
      </div>
    );
  }

  // Group activities by date for flat view
  const activityByDate = groupByDate(activities);

  return (
    <div className="space-y-6">
      {Object.entries(activityByDate).map(([date, dateActivities]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {date}
            </h3>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="space-y-3">
            {dateActivities.map((activity) => (
              <TimelineItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByDate(activities: StoredActivity[]): Record<string, StoredActivity[]> {
  const groups: Record<string, StoredActivity[]> = {};

  for (const activity of activities) {
    const date = formatDateHeader(activity.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
  }

  return groups;
}

function formatDateHeader(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
