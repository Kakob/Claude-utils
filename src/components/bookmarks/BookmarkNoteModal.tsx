import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BookmarkNoteModalProps {
  messagePreview: string;
  existingNote?: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}

export function BookmarkNoteModal({
  messagePreview,
  existingNote,
  onSave,
  onCancel,
}: BookmarkNoteModalProps) {
  const [note, setNote] = useState(existingNote || '');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bookmark Note
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            {messagePreview}
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 resize-y"
            autoFocus
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(note)}
              className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
