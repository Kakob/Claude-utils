import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Loader2 } from 'lucide-react';
import { BookmarkCard } from '../components/bookmarks';
import { useBookmarkStore } from '../stores/bookmarkStore';
import type { ApiBookmark } from '../lib/api';

export function BookmarksPage() {
  const navigate = useNavigate();
  const {
    bookmarks,
    isLoading,
    hasMore,
    error,
    fetchBookmarks,
    deleteBookmark,
  } = useBookmarkStore();

  useEffect(() => {
    fetchBookmarks({ reset: true });
  }, [fetchBookmarks]);

  const handleNavigate = (bookmark: ApiBookmark) => {
    navigate(`/conversations/${bookmark.conversationId}?scrollTo=${bookmark.messageId}`);
  };

  const handleDelete = async (bookmark: ApiBookmark) => {
    if (!confirm('Remove this bookmark?')) return;
    await deleteBookmark(bookmark.id, bookmark.messageId);
  };

  const handleLoadMore = () => {
    fetchBookmarks();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Bookmarks
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {bookmarks.length} bookmarked message{bookmarks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {!isLoading && bookmarks.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
          <p>No bookmarks yet</p>
          <p className="text-sm mt-2">
            Bookmark messages in conversations to save them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onNavigate={handleNavigate}
              onDelete={handleDelete}
            />
          ))}

          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          )}

          {!isLoading && hasMore && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
            >
              Load more bookmarks
            </button>
          )}
        </div>
      )}
    </div>
  );
}
