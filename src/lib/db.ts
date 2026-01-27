import Dexie, { type Table } from 'dexie';
import type {
  StoredConversation,
  StoredMessage,
  StoredPrompt,
  AppMetadata,
} from '../types';

export class ClaudeUtilsDB extends Dexie {
  conversations!: Table<StoredConversation>;
  messages!: Table<StoredMessage>;
  prompts!: Table<StoredPrompt>;
  metadata!: Table<AppMetadata>;

  constructor() {
    super('ClaudeUtils');

    this.version(1).stores({
      conversations: 'id, source, createdAt, updatedAt, name',
      messages: 'id, conversationId, createdAt',
      prompts: 'id, folder, *tags, createdAt',
      metadata: 'key',
    });
  }
}

export const db = new ClaudeUtilsDB();

// Helper functions for common operations

export async function getConversation(id: string): Promise<StoredConversation | undefined> {
  return db.conversations.get(id);
}

export async function getConversations(options?: {
  source?: 'claude.ai' | 'claude-code';
  limit?: number;
  offset?: number;
}): Promise<StoredConversation[]> {
  let query = db.conversations.orderBy('updatedAt').reverse();

  if (options?.source) {
    query = db.conversations.where('source').equals(options.source).reverse();
  }

  if (options?.offset) {
    query = query.offset(options.offset);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  return query.toArray();
}

export async function getMessagesForConversation(
  conversationId: string
): Promise<StoredMessage[]> {
  return db.messages
    .where('conversationId')
    .equals(conversationId)
    .sortBy('createdAt');
}

export async function getConversationCount(): Promise<number> {
  return db.conversations.count();
}

export async function getMessageCount(): Promise<number> {
  return db.messages.count();
}

export async function getMetadata<T>(key: string): Promise<T | undefined> {
  const entry = await db.metadata.get(key);
  return entry?.value as T | undefined;
}

export async function setMetadata(key: string, value: unknown): Promise<void> {
  await db.metadata.put({ key, value });
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.conversations, db.messages, db.metadata], async () => {
    await db.conversations.clear();
    await db.messages.clear();
    await db.metadata.clear();
  });
}

export async function clearDataBySource(source: 'claude.ai' | 'claude-code'): Promise<void> {
  await db.transaction('rw', [db.conversations, db.messages], async () => {
    const conversationIds = await db.conversations
      .where('source')
      .equals(source)
      .primaryKeys();

    await db.messages
      .where('conversationId')
      .anyOf(conversationIds)
      .delete();

    await db.conversations.where('source').equals(source).delete();
  });
}
