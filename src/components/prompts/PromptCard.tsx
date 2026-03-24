import { useState } from 'react';
import { Copy, Pencil, Trash2, Folder, Check, Hash } from 'lucide-react';
import type { ApiPrompt } from '../../lib/api';

interface PromptCardProps {
  prompt: ApiPrompt;
  onCopy: (prompt: ApiPrompt) => void;
  onEdit: (prompt: ApiPrompt) => void;
  onDelete: (prompt: ApiPrompt) => void;
}

export function PromptCard({ prompt, onCopy, onEdit, onDelete }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={() => onEdit(prompt)}
      className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">
          {prompt.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-400 hover:text-violet-600 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(prompt); }}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {prompt.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
          {prompt.description}
        </p>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono line-clamp-2 mb-3">
        {prompt.content.slice(0, 120)}
        {prompt.content.length > 120 ? '...' : ''}
      </p>

      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <Hash size={9} />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        {prompt.folder && (
          <span className="flex items-center gap-1">
            <Folder size={11} />
            {prompt.folder}
          </span>
        )}
        <span>{formatDate(prompt.updatedAt)}</span>
        {prompt.usageCount > 0 && (
          <span>{prompt.usageCount} use{prompt.usageCount !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}
