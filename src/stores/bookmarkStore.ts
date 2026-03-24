import { create } from 'zustand';
import { bookmarkApi, type ApiBookmark } from '../lib/api';

interface BookmarkState {
  bookmarks: ApiBookmark[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  // Cache: messageId -> bookmarkId for quick lookups
  bookmarkedMessages: Map<string, string>;

  fetchBookmarks: (options?: { conversationId?: string; reset?: boolean }) => Promise<void>;
  createBookmark: (data: { conversationId: string; messageId: string; note?: string }) => Promise<void>;
  deleteBookmark: (id: string, messageId: string) => Promise<void>;
  updateBookmarkNote: (id: string, note: string) => Promise<void>;
  loadConversationBookmarks: (conversationId: string) => Promise<void>;
  isMessageBookmarked: (messageId: string) => boolean;
  getBookmarkIdForMessage: (messageId: string) => string | undefined;
}

const LIMIT = 50;

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  isLoading: false,
  error: null,
  hasMore: false,
  offset: 0,
  bookmarkedMessages: new Map(),

  fetchBookmarks: async (options) => {
    const reset = options?.reset ?? false;
    const offset = reset ? 0 : get().offset;

    set({ isLoading: true, error: null });
    try {
      const result = await bookmarkApi.getBookmarks({
        conversationId: options?.conversationId,
        limit: LIMIT,
        offset,
      });
      set({
        bookmarks: reset ? result.data : [...get().bookmarks, ...result.data],
        hasMore: result.pagination.hasMore,
        offset: offset + result.data.length,
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createBookmark: async (data) => {
    const result = await bookmarkApi.createBookmark(data);
    const map = new Map(get().bookmarkedMessages);
    map.set(data.messageId, result.id);
    set({ bookmarkedMessages: map });
  },

  deleteBookmark: async (id, messageId) => {
    await bookmarkApi.deleteBookmark(id);
    const map = new Map(get().bookmarkedMessages);
    map.delete(messageId);
    set({
      bookmarkedMessages: map,
      bookmarks: get().bookmarks.filter((b) => b.id !== id),
    });
  },

  updateBookmarkNote: async (id, note) => {
    await bookmarkApi.updateBookmark(id, { note });
    set({
      bookmarks: get().bookmarks.map((b) =>
        b.id === id ? { ...b, note } : b
      ),
    });
  },

  loadConversationBookmarks: async (conversationId) => {
    const items = await bookmarkApi.getConversationBookmarks(conversationId);
    const map = new Map(get().bookmarkedMessages);
    for (const item of items) {
      map.set(item.messageId, item.id);
    }
    set({ bookmarkedMessages: map });
  },

  isMessageBookmarked: (messageId) => {
    return get().bookmarkedMessages.has(messageId);
  },

  getBookmarkIdForMessage: (messageId) => {
    return get().bookmarkedMessages.get(messageId);
  },
}));
