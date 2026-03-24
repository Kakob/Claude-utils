import { MessageSquare, Trash2, ExternalLink, User, Bot } from 'lucide-react';
import type { ApiBookmark } from '../../lib/api';

interface BookmarkCardProps {
  bookmark: ApiBookmark;
  onNavigate: (bookmark: ApiBookmark) => void;
  onDelete: (bookmark: ApiBookmark) => void;
}

export function BookmarkCard({ bookmark, onNavigate, onDelete }: BookmarkCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const SenderIcon = bookmark.messageSender === 'user' ? User : Bot;

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
      {/* Conversation name */}
      {bookmark.conversationName && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
          <MessageSquare size={10} />
          {bookmark.conversationName}
        </p>
      )}

      {/* Message preview */}
      <div className="flex items-start gap-2 mb-2">
        <SenderIcon size={14} className="mt-0.5 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {bookmark.messagePreview}
        </p>
      </div>

      {/* Note */}
      {bookmark.note && (
        <p className="text-sm text-violet-600 dark:text-violet-400 italic mb-2 pl-6">
          {bookmark.note}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{formatDate(bookmark.createdAt)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(bookmark)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded transition-colors"
          >
            <ExternalLink size={12} />
            Go to message
          </button>
          <button
            onClick={() => onDelete(bookmark)}
            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
            title="Delete bookmark"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
