import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Search, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useSearch } from '../hooks';
import { SearchBar, SearchFilters, SearchResults } from '../components/search';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    query,
    setQuery,
    results,
    isLoading,
    isIndexing,
    error,
    source,
    setSource,
    resultCount,
    isPro,
    totalConversations,
    searchableConversations,
  } = useSearch();

  const showUpgradeBanner = !isPro && totalConversations > searchableConversations;

  // Sync query from URL params on initial mount
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [query, setSearchParams]);

  const handleResultClick = (conversationId: string) => {
    // Pass the query as a URL param so ConversationView can highlight matches
    navigate(`/conversations/${conversationId}?highlight=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Full-text search across all your Claude conversations
        </p>
      </div>

      <div className="space-y-4">
        {showUpgradeBanner && (
          <div className="flex items-center justify-between p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-violet-600 dark:text-violet-400" />
              <span className="text-violet-700 dark:text-violet-300">
                Searching {searchableConversations} of {totalConversations} conversations.
              </span>
            </div>
            <a
              href="/settings"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Upgrade to Pro
            </a>
          </div>
        )}

        <SearchBar
          value={query}
          onChange={setQuery}
          isLoading={isLoading}
          autoFocus
        />

        {/* Show filters and results when we have a query */}
        {query.trim() && (
          <>
            <SearchFilters
              source={source}
              onSourceChange={setSource}
              resultCount={resultCount}
              isLoading={isLoading}
            />

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <SearchResults
              results={results}
              query={query}
              onResultClick={handleResultClick}
              isLoading={isLoading}
            />

            {/* No results state */}
            {!isLoading && !error && results.length === 0 && query.trim() && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">No results found for "{query}"</p>
                <p className="text-sm mt-2">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty state when no query */}
        {!query.trim() && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            {isIndexing ? (
              <>
                <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-50" />
                <p>Building search index...</p>
                <p className="text-sm mt-2">This only happens once</p>
              </>
            ) : (
              <>
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>Start typing to search your conversations</p>
                <p className="text-sm mt-2">
                  Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs">/</kbd> to focus search
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
