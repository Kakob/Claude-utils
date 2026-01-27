import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Globe, Terminal, Filter } from 'lucide-react';
import { ConversationList, ConversationView } from '../components/conversations';
import { useConversations, useConversation } from '../hooks';
import type { StoredConversation, DataSource } from '../types';

export function ConversationsPage() {
  const { id: urlId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [sourceFilter, setSourceFilter] = useState<DataSource | undefined>(undefined);

  // Use URL id directly - no need for local state
  const selectedId = urlId || null;
  const highlightQuery = searchParams.get('highlight') || undefined;

  const {
    conversations,
    isLoading,
    hasMore,
    loadMore,
  } = useConversations({ source: sourceFilter });

  const {
    conversation: selectedConversation,
    messages,
    isLoading: messagesLoading,
  } = useConversation(selectedId);

  const handleSelect = (conversation: StoredConversation) => {
    navigate(`/conversations/${conversation.id}`, { replace: true });
  };

  const handleBack = () => {
    navigate('/conversations', { replace: true });
  };

  // Show conversation detail view when a conversation is selected
  if (selectedId && selectedConversation && !messagesLoading) {
    return (
      <ConversationView
        conversation={selectedConversation}
        messages={messages}
        onBack={handleBack}
        highlightQuery={highlightQuery}
      />
    );
  }

  // Show empty state when no conversations
  if (!isLoading && conversations.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Conversations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse all your Claude conversations
          </p>
        </div>

        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>No conversations yet</p>
          <p className="text-sm mt-2">
            Import your Claude data to browse conversations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Conversations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <div className="flex gap-1">
            <button
              onClick={() => setSourceFilter(undefined)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sourceFilter === undefined
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSourceFilter('claude.ai')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                sourceFilter === 'claude.ai'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Globe size={14} />
              Claude.ai
            </button>
            <button
              onClick={() => setSourceFilter('claude-code')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                sourceFilter === 'claude-code'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Terminal size={14} />
              Claude Code
            </button>
          </div>
        </div>
      </div>

      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelect}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
