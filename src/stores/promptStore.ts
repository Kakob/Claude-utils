import { create } from 'zustand';
import { promptApi, type ApiPrompt } from '../lib/api';

interface PromptState {
  prompts: ApiPrompt[];
  folders: string[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;

  fetchPrompts: (options?: { folder?: string; search?: string; reset?: boolean }) => Promise<void>;
  fetchFolders: () => Promise<void>;
  createPrompt: (data: {
    title: string;
    content: string;
    description?: string;
    folder?: string;
    tags?: string[];
  }) => Promise<ApiPrompt>;
  updatePrompt: (id: string, data: {
    title?: string;
    content?: string;
    description?: string;
    folder?: string;
    tags?: string[];
  }) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  usePrompt: (id: string) => Promise<void>;
}

const LIMIT = 50;

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  folders: [],
  isLoading: false,
  error: null,
  hasMore: false,
  offset: 0,

  fetchPrompts: async (options) => {
    const reset = options?.reset ?? false;
    const offset = reset ? 0 : get().offset;

    set({ isLoading: true, error: null });
    try {
      const result = await promptApi.getPrompts({
        folder: options?.folder,
        search: options?.search,
        limit: LIMIT,
        offset,
      });
      set({
        prompts: reset ? result.data : [...get().prompts, ...result.data],
        hasMore: result.pagination.hasMore,
        offset: offset + result.data.length,
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchFolders: async () => {
    try {
      const folders = await promptApi.getFolders();
      set({ folders });
    } catch {
      // Silently fail for folders
    }
  },

  createPrompt: async (data) => {
    const prompt = await promptApi.createPrompt(data);
    set({ prompts: [prompt, ...get().prompts] });
    // Refresh folders in case a new folder was created
    get().fetchFolders();
    return prompt;
  },

  updatePrompt: async (id, data) => {
    const updated = await promptApi.updatePrompt(id, data);
    set({
      prompts: get().prompts.map((p) => (p.id === id ? updated : p)),
    });
    get().fetchFolders();
  },

  deletePrompt: async (id) => {
    await promptApi.deletePrompt(id);
    set({ prompts: get().prompts.filter((p) => p.id !== id) });
  },

  usePrompt: async (id) => {
    const updated = await promptApi.usePrompt(id);
    set({
      prompts: get().prompts.map((p) => (p.id === id ? updated : p)),
    });
  },
}));
