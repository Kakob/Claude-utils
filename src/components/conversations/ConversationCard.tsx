import { Globe, Terminal, MessageSquare, Calendar } from 'lucide-react';
import type { StoredConversation } from '../../types';

interface ConversationCardProps {
  conversation: StoredConversation;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ConversationCard({
  conversation,
  isSelected = false,
  onClick,
}: ConversationCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        ${isSelected
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {conversation.source === 'claude.ai' ? (
              <Globe size={14} className="text-violet-500 flex-shrink-0" />
            ) : (
              <Terminal size={14} className="text-emerald-500 flex-shrink-0" />
            )}
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {conversation.name}
            </h3>
          </div>

          {conversation.summary && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {conversation.summary}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <MessageSquare size={12} />
              {conversation.messageCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(conversation.updatedAt)}
            </span>
            {conversation.gitBranch && (
              <span className="text-emerald-600 dark:text-emerald-400">
                {conversation.gitBranch}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
