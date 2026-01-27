import { FileArchive, FileCode } from 'lucide-react';
import { DropZone, ImportProgress } from '../components/import';
import { useImport } from '../hooks';

export function ImportPage() {
  const { isImporting, progress, error, result, handleFiles, reset } = useImport();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Import Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Import your Claude conversations from Claude.ai or Claude Code
        </p>
      </div>

      {/* Show progress/result/error when importing */}
      {(isImporting || error || result) && (
        <div className="mb-6">
          <ImportProgress
            progress={progress}
            error={error}
            result={result}
            onReset={reset}
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Claude.ai Import */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <FileArchive className="text-violet-600 dark:text-violet-400" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Claude.ai
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ZIP export from Settings
              </p>
            </div>
          </div>

          <DropZone
            onFiles={handleFiles}
            accept=".zip,.json"
            label="Drag & drop your ZIP file"
            hint="or click to browse"
            accentColor="violet"
            disabled={isImporting}
          />

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Export from Claude.ai: Settings → Privacy → Export Data
          </p>
        </div>

        {/* Claude Code Import */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FileCode className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Claude Code
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                JSONL log files
              </p>
            </div>
          </div>

          <DropZone
            onFiles={handleFiles}
            accept=".jsonl"
            multiple
            label="Drag & drop JSONL files"
            hint="or click to browse (multiple allowed)"
            accentColor="emerald"
            disabled={isImporting}
          />

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Located at: ~/.claude/projects/
          </p>
        </div>
      </div>
    </div>
  );
}
