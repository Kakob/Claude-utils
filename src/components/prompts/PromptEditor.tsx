import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ApiPrompt } from '../../lib/api';

interface PromptEditorProps {
  prompt?: ApiPrompt;
  folders: string[];
  onSave: (data: {
    title: string;
    content: string;
    description?: string;
    folder?: string;
    tags?: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function PromptEditor({ prompt, folders, onSave, onCancel }: PromptEditorProps) {
  const [title, setTitle] = useState(prompt?.title || '');
  const [content, setContent] = useState(prompt?.content || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [folder, setFolder] = useState(prompt?.folder || '');
  const [tagsText, setTagsText] = useState(prompt?.tags.join(', ') || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onSave({
        title: title.trim(),
        content: content.trim(),
        description: description.trim() || undefined,
        folder: folder.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {prompt ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Code Review Prompt"
              className={inputClass}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this prompt"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your prompt text..."
              rows={8}
              className={`${inputClass} font-mono resize-y`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Folder
              </label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g. Development"
                list="folder-suggestions"
                className={inputClass}
              />
              {folders.length > 0 && (
                <datalist id="folder-suggestions">
                  {folders.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="comma, separated"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || saving}
              className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : prompt ? 'Save Changes' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
