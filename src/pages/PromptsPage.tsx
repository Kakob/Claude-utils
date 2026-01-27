import { FileText, Plus } from 'lucide-react';

export function PromptsPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Prompt Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Save and organize your best prompts
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
          <Plus size={18} />
          New Prompt
        </button>
      </div>

      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <FileText size={48} className="mx-auto mb-4 opacity-50" />
        <p>No saved prompts yet</p>
        <p className="text-sm mt-2">
          Save prompts you want to reuse
        </p>
      </div>
    </div>
  );
}
