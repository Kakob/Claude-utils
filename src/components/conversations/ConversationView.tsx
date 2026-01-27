import { ArrowLeft, Download, Copy, Globe, Terminal, X } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { StoredConversation, StoredMessage } from '../../types';

interface ConversationViewProps {
  conversation: StoredConversation;
  messages: StoredMessage[];
  onBack: () => void;
  highlightQuery?: string;
}

export function ConversationView({
  conversation,
  messages,
  onBack,
  highlightQuery,
}: ConversationViewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCopy = async () => {
    const text = messages
      .filter((m) => m.sender === 'user' || m.sender === 'assistant')
      .map((m) => `${m.sender === 'user' ? 'User' : 'Claude'}: ${m.text}`)
      .join('\n\n');

    await navigator.clipboard.writeText(text);
  };

  const handleClearHighlight = () => {
    // Remove highlight query param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('highlight');
    window.history.replaceState({}, '', url.toString());
    // Force re-render by navigating
    window.location.replace(url.toString());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {conversation.source === 'claude.ai' ? (
              <Globe size={16} className="text-violet-500" />
            ) : (
              <Terminal size={16} className="text-emerald-500" />
            )}
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {conversation.name}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(conversation.createdAt)} · {conversation.messageCount} messages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Copy conversation"
          >
            <Copy size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Export conversation"
          >
            <Download size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Highlight indicator */}
      {highlightQuery && (
        <div className="flex items-center justify-between px-3 py-2 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Highlighting matches for: <strong>"{highlightQuery}"</strong>
          </span>
          <button
            onClick={handleClearHighlight}
            className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-800/30 text-yellow-700 dark:text-yellow-300"
            title="Clear highlight"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              highlightQuery={highlightQuery}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
