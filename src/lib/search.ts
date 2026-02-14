import Fuse from 'fuse.js';
import type { FuseResult, RangeTuple, IFuseOptions } from 'fuse.js';
import { getConversations } from './db';
import type { StoredConversation, DataSource } from '../types';

export interface SearchMatch {
  indices: RangeTuple[];
  key: string;
  value: string;
}

export interface SearchResult {
  conversation: StoredConversation;
  score: number;
  matches: SearchMatch[];
  snippet: string;
}

const FUSE_OPTIONS: IFuseOptions<StoredConversation> = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'summary', weight: 1.5 },
    { name: 'fullText', weight: 1 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
  findAllMatches: true,
};

const FREE_TIER_LIMIT = 100;

let fuseIndex: Fuse<StoredConversation> | null = null;
let fuseIndexPro: Fuse<StoredConversation> | null = null;
let indexedConversations: StoredConversation[] = [];
let indexedConversationsFree: StoredConversation[] = [];
let totalConversationCount = 0;

export async function buildSearchIndex(): Promise<void> {
  // Fetch all conversations via API (sorted by updatedAt descending by default)
  const conversations = await getConversations({ limit: 10000 });

  // Sort by createdAt descending (newest first) for consistent free tier
  conversations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  totalConversationCount = conversations.length;
  indexedConversations = conversations;
  fuseIndexPro = new Fuse(conversations, FUSE_OPTIONS);

  // Free tier gets first 100 conversations (most recent)
  indexedConversationsFree = conversations.slice(0, FREE_TIER_LIMIT);
  fuseIndex = new Fuse(indexedConversationsFree, FUSE_OPTIONS);
}

export function getSearchIndex(): Fuse<StoredConversation> | null {
  return fuseIndex;
}

export function isIndexReady(): boolean {
  return fuseIndex !== null;
}

export async function ensureIndex(): Promise<Fuse<StoredConversation>> {
  if (!fuseIndex) {
    await buildSearchIndex();
  }
  return fuseIndex!;
}

function extractSnippet(
  text: string,
  indices: RangeTuple[],
  contextLength: number = 60
): string {
  if (!indices.length || !text) {
    return text.slice(0, 150) + (text.length > 150 ? '...' : '');
  }

  // Find the first match
  const [start, end] = indices[0];

  // Calculate context bounds
  const snippetStart = Math.max(0, start - contextLength);
  const snippetEnd = Math.min(text.length, end + contextLength);

  let snippet = text.slice(snippetStart, snippetEnd);

  // Add ellipsis
  if (snippetStart > 0) {
    snippet = '...' + snippet;
  }
  if (snippetEnd < text.length) {
    snippet = snippet + '...';
  }

  return snippet;
}

export async function search(
  query: string,
  options?: {
    source?: DataSource;
    limit?: number;
    isPro?: boolean;
  }
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  await ensureIndex();
  const fuse = options?.isPro ? fuseIndexPro! : fuseIndex!;
  const results = fuse.search(query);

  let filteredResults: FuseResult<StoredConversation>[] = results;

  // Filter by source if specified
  if (options?.source) {
    filteredResults = results.filter(
      (result) => result.item.source === options.source
    );
  }

  // Apply limit
  if (options?.limit) {
    filteredResults = filteredResults.slice(0, options.limit);
  }

  return filteredResults.map((result) => {
    // Find the best match for snippet extraction
    const matches: SearchMatch[] = (result.matches || []).map((match) => ({
      indices: match.indices as RangeTuple[],
      key: match.key || '',
      value: match.value || '',
    }));

    // Prioritize fullText match for snippet, fallback to summary, then name
    const fullTextMatch = matches.find((m) => m.key === 'fullText');
    const summaryMatch = matches.find((m) => m.key === 'summary');
    const nameMatch = matches.find((m) => m.key === 'name');

    const bestMatch = fullTextMatch || summaryMatch || nameMatch;
    const snippet = bestMatch
      ? extractSnippet(bestMatch.value, bestMatch.indices)
      : result.item.summary || result.item.fullText.slice(0, 150);

    return {
      conversation: result.item,
      score: result.score || 0,
      matches,
      snippet,
    };
  });
}

export async function invalidateIndex(): Promise<void> {
  fuseIndex = null;
  fuseIndexPro = null;
  indexedConversations = [];
  indexedConversationsFree = [];
  totalConversationCount = 0;
}

export function getIndexedCount(isPro?: boolean): number {
  return isPro ? indexedConversations.length : indexedConversationsFree.length;
}

export function getTotalConversationCount(): number {
  return totalConversationCount;
}

export function getFreeTierLimit(): number {
  return FREE_TIER_LIMIT;
}
