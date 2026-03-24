import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, Folder, X } from 'lucide-react';
import { PromptList, PromptEditor } from '../components/prompts';
import { usePromptStore } from '../stores/promptStore';
import type { ApiPrompt } from '../lib/api';

export function PromptsPage() {
  const {
    prompts,
    folders,
    isLoading,
    hasMore,
    fetchPrompts,
    fetchFolders,
    createPrompt,
    updatePrompt,
    deletePrompt,
    usePrompt,
  } = usePromptStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<ApiPrompt | null>(null);

  // Load prompts and folders on mount and when filters change
  useEffect(() => {
    fetchPrompts({
      search: searchQuery || undefined,
      folder: folderFilter || undefined,
      reset: true,
    });
  }, [searchQuery, folderFilter, fetchPrompts]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleLoadMore = useCallback(() => {
    fetchPrompts({
      search: searchQuery || undefined,
      folder: folderFilter || undefined,
    });
  }, [searchQuery, folderFilter, fetchPrompts]);

  const handleCopy = async (prompt: ApiPrompt) => {
    await navigator.clipboard.writeText(prompt.content);
    usePrompt(prompt.id);
  };

  const handleEdit = (prompt: ApiPrompt) => {
    setEditingPrompt(prompt);
    setEditorOpen(true);
  };

  const handleDelete = async (prompt: ApiPrompt) => {
    if (!confirm(`Delete "${prompt.title}"?`)) return;
    await deletePrompt(prompt.id);
  };

  const handleNew = () => {
    setEditingPrompt(null);
    setEditorOpen(true);
  };

  const handleSave = async (data: {
    title: string;
    content: string;
    description?: string;
    folder?: string;
    tags?: string[];
  }) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, data);
    } else {
      await createPrompt(data);
    }
    setEditorOpen(false);
    setEditingPrompt(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Prompt Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          New Prompt
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Folder pills */}
      {folders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Folder size={14} className="text-gray-400" />
          <button
            onClick={() => setFolderFilter(null)}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
              folderFilter === null
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            All
          </button>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setFolderFilter(f === folderFilter ? null : f)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                folderFilter === f
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Prompt list or empty state */}
      {!isLoading && prompts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>
            {searchQuery || folderFilter ? 'No prompts match your filters' : 'No saved prompts yet'}
          </p>
          <p className="text-sm mt-2">
            {searchQuery || folderFilter
              ? 'Try adjusting your search or filters'
              : 'Save prompts you want to reuse'}
          </p>
        </div>
      ) : (
        <PromptList
          prompts={prompts}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Editor modal */}
      {editorOpen && (
        <PromptEditor
          prompt={editingPrompt || undefined}
          folders={folders}
          onSave={handleSave}
          onCancel={() => {
            setEditorOpen(false);
            setEditingPrompt(null);
          }}
        />
      )}
    </div>
  );
}
