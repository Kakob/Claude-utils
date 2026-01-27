import { useState, useCallback } from 'react';
import { importFiles, type ImportResult, type ImportProgress } from '../lib/import';
import { useAppStore } from '../stores/appStore';
import { db } from '../lib/db';
import { invalidateIndex } from '../lib/search';

interface UseImportReturn {
  isImporting: boolean;
  progress: ImportProgress | null;
  error: string | null;
  result: ImportResult | null;
  handleFiles: (files: File[]) => Promise<void>;
  reset: () => void;
}

export function useImport(): UseImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { setStats, setLastSync } = useAppStore();

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const importResult = await importFiles(files, setProgress);
      setResult(importResult);

      // Update global stats
      const conversationCount = await db.conversations.count();
      const messageCount = await db.messages.count();
      setStats({ conversationCount, messageCount });
      setLastSync(importResult.source, new Date());

      // Invalidate search index so new conversations are searchable
      await invalidateIndex();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }, [setStats, setLastSync]);

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setResult(null);
  }, []);

  return {
    isImporting,
    progress,
    error,
    result,
    handleFiles,
    reset,
  };
}
