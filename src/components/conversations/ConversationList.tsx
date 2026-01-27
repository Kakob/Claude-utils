import { Loader2 } from 'lucide-react';
import { ConversationCard } from './ConversationCard';
import type { StoredConversation } from '../../types';

interface ConversationListProps {
  conversations: StoredConversation[];
  selectedId?: string | null;
  onSelect: (conversation: StoredConversation) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
  hasMore = false,
  onLoadMore,
}: ConversationListProps) {
  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedId === conversation.id}
          onClick={() => onSelect(conversation)}
        />
      ))}

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      )}

      {!isLoading && hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
        >
          Load more conversations
        </button>
      )}
    </div>
  );
}
