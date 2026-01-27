import { useState, useEffect, useCallback, useRef } from 'react';
import {
  search,
  buildSearchIndex,
  isIndexReady,
  invalidateIndex,
  getTotalConversationCount,
  getFreeTierLimit,
  type SearchResult,
} from '../lib/search';
import { useAppStore } from '../stores/appStore';
import type { DataSource } from '../types';

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  isIndexing: boolean;
  error: string | null;
  source: DataSource | null;
  setSource: (source: DataSource | null) => void;
  resultCount: number;
  rebuildIndex: () => Promise<void>;
  isPro: boolean;
  totalConversations: number;
  searchableConversations: number;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, limit = 50 } = options;

  const { isPro } = useAppStore();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DataSource | null>(null);
  const [totalConversations, setTotalConversations] = useState(0);

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce query input
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, debounceMs]);

  // Build index on mount if needed
  useEffect(() => {
    const initIndex = async () => {
      if (!isIndexReady()) {
        setIsIndexing(true);
        try {
          await buildSearchIndex();
          setTotalConversations(getTotalConversationCount());
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to build search index');
        } finally {
          setIsIndexing(false);
        }
      } else {
        setTotalConversations(getTotalConversationCount());
      }
    };

    initIndex();
  }, []);

  // Perform search when debounced query or source changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await search(debouncedQuery, {
          source: source || undefined,
          limit,
          isPro,
        });
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, source, limit, isPro]);

  const rebuildIndex = useCallback(async () => {
    setIsIndexing(true);
    setError(null);
    try {
      await invalidateIndex();
      await buildSearchIndex();
      setTotalConversations(getTotalConversationCount());
      // Re-run search with current query
      if (debouncedQuery.trim()) {
        const searchResults = await search(debouncedQuery, {
          source: source || undefined,
          limit,
          isPro,
        });
        setResults(searchResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rebuild index');
    } finally {
      setIsIndexing(false);
    }
  }, [debouncedQuery, source, limit, isPro]);

  const searchableConversations = isPro ? totalConversations : Math.min(totalConversations, getFreeTierLimit());

  return {
    query,
    setQuery,
    results,
    isLoading,
    isIndexing,
    error,
    source,
    setSource,
    resultCount: results.length,
    rebuildIndex,
    isPro,
    totalConversations,
    searchableConversations,
  };
}
