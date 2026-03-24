import { Loader2 } from 'lucide-react';
import { PromptCard } from './PromptCard';
import type { ApiPrompt } from '../../lib/api';

interface PromptListProps {
  prompts: ApiPrompt[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onCopy: (prompt: ApiPrompt) => void;
  onEdit: (prompt: ApiPrompt) => void;
  onDelete: (prompt: ApiPrompt) => void;
}

export function PromptList({
  prompts,
  isLoading,
  hasMore,
  onLoadMore,
  onCopy,
  onEdit,
  onDelete,
}: PromptListProps) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onCopy={onCopy}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      )}

      {!isLoading && hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-3 mt-4 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
        >
          Load more prompts
        </button>
      )}
    </div>
  );
}
