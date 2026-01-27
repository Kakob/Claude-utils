import { db } from './db';
import { parseFiles, type ParsedData } from './parsers';
import type { StoredConversation, StoredMessage, DataSource } from '../types';

export interface ImportResult {
  conversationsAdded: number;
  conversationsSkipped: number;
  messagesAdded: number;
  source: DataSource;
}

export interface ImportProgress {
  phase: 'parsing' | 'storing' | 'complete';
  current: number;
  total: number;
  filename?: string;
}

export async function importFiles(
  files: File[],
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  // Phase 1: Parse files
  const parsed = await parseFiles(files, (current, total, filename) => {
    onProgress?.({
      phase: 'parsing',
      current,
      total,
      filename,
    });
  });

  // Phase 2: Store in database
  onProgress?.({
    phase: 'storing',
    current: 0,
    total: parsed.conversations.length,
  });

  const result = await storeData(parsed, (current, total) => {
    onProgress?.({
      phase: 'storing',
      current,
      total,
    });
  });

  onProgress?.({
    phase: 'complete',
    current: result.conversationsAdded,
    total: result.conversationsAdded,
  });

  return result;
}

async function storeData(
  data: ParsedData,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  let conversationsAdded = 0;
  let conversationsSkipped = 0;
  let messagesAdded = 0;

  // Get existing conversation IDs to detect duplicates
  const existingIds = new Set(
    await db.conversations.toCollection().primaryKeys()
  );

  // Filter out duplicates
  const newConversations: StoredConversation[] = [];
  const newMessages: StoredMessage[] = [];

  for (const conv of data.conversations) {
    if (existingIds.has(conv.id)) {
      conversationsSkipped++;
    } else {
      newConversations.push(conv);
      // Get messages for this conversation
      const convMessages = data.messages.filter(
        (m) => m.conversationId === conv.id
      );
      newMessages.push(...convMessages);
    }
  }

  // Batch insert in chunks
  const CHUNK_SIZE = 100;

  for (let i = 0; i < newConversations.length; i += CHUNK_SIZE) {
    const convChunk = newConversations.slice(i, i + CHUNK_SIZE);
    await db.conversations.bulkAdd(convChunk);
    conversationsAdded += convChunk.length;
    onProgress?.(Math.min(i + CHUNK_SIZE, newConversations.length), newConversations.length);
  }

  for (let i = 0; i < newMessages.length; i += CHUNK_SIZE) {
    const msgChunk = newMessages.slice(i, i + CHUNK_SIZE);
    await db.messages.bulkAdd(msgChunk);
    messagesAdded += msgChunk.length;
  }

  // Update last sync metadata
  await db.metadata.put({
    key: `lastSync.${data.source}`,
    value: new Date().toISOString(),
  });

  return {
    conversationsAdded,
    conversationsSkipped,
    messagesAdded,
    source: data.source,
  };
}
