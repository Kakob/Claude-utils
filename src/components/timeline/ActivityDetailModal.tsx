import { X, MessageSquare, MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { StoredActivity } from '../../types';
import { ActivityBadge } from './ActivityBadge';
import { TokenDisplay } from './TokenDisplay';

interface ActivityDetailModalProps {
  activity: StoredActivity;
  onClose: () => void;
}

export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  const [copiedSection, setCopiedSection] = useState<'user' | 'assistant' | 'code' | null>(null);

  const handleCopy = async (text: string, section: 'user' | 'assistant' | 'code') => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <ActivityBadge type={activity.type} />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Message Exchange
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta info */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 text-sm">
          {activity.model && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Model:</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{activity.model}</span>
            </div>
          )}
          {activity.conversationId && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Conversation:</span>
              <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{activity.conversationId.slice(0, 8)}...</span>
            </div>
          )}
          <TokenDisplay tokens={activity.tokens} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* User Message */}
          {activity.metadata.userMessage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                  <MessageSquare className="w-4 h-4" />
                  <span>You</span>
                </div>
                <button
                  onClick={() => handleCopy(activity.metadata.userMessage!, 'user')}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  {copiedSection === 'user' ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {activity.metadata.userMessage}
                </p>
              </div>
            </div>
          )}

          {/* Assistant Response */}
          {activity.metadata.fullContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>Claude</span>
                </div>
                <button
                  onClick={() => handleCopy(activity.metadata.fullContent!, 'assistant')}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  {copiedSection === 'assistant' ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {activity.metadata.fullContent}
                </p>
              </div>
            </div>
          )}

          {/* Code Content */}
          {activity.metadata.codeContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code ({activity.metadata.codeLanguage || 'unknown'})
                </h4>
                <button
                  onClick={() => handleCopy(activity.metadata.codeContent!, 'code')}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  {copiedSection === 'code' ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                <code>{activity.metadata.codeContent}</code>
              </pre>
            </div>
          )}

          {/* Fallback if no full content */}
          {!activity.metadata.fullContent && !activity.metadata.userMessage && !activity.metadata.codeContent && activity.metadata.messagePreview && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 italic">
                {activity.metadata.messagePreview}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Full content not available for this activity.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
