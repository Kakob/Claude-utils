import Dexie, { type Table } from 'dexie';
import type {
  StoredConversation,
  StoredMessage,
  StoredPrompt,
  AppMetadata,
  StoredActivity,
  DailyStats,
  ActivityFilters,
} from '../types';

export class ClaudeUtilsDB extends Dexie {
  conversations!: Table<StoredConversation>;
  messages!: Table<StoredMessage>;
  prompts!: Table<StoredPrompt>;
  metadata!: Table<AppMetadata>;
  activities!: Table<StoredActivity>;
  dailyStats!: Table<DailyStats>;

  constructor() {
    super('ClaudeUtils');

    this.version(1).stores({
      conversations: 'id, source, createdAt, updatedAt, name',
      messages: 'id, conversationId, createdAt',
      prompts: 'id, folder, *tags, createdAt',
      metadata: 'key',
    });

    this.version(2).stores({
      conversations: 'id, source, createdAt, updatedAt, name',
      messages: 'id, conversationId, createdAt',
      prompts: 'id, folder, *tags, createdAt',
      metadata: 'key',
      activities: 'id, type, source, conversationId, timestamp, [source+timestamp]',
      dailyStats: 'date',
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

// Activity tracking functions

export async function addActivity(activity: StoredActivity): Promise<string> {
  await db.activities.add(activity);

  // Update daily stats
  const dateStr = activity.timestamp.toISOString().split('T')[0];
  await updateDailyStatsFromActivity(dateStr, activity);

  return activity.id;
}

export async function getActivities(filters?: ActivityFilters): Promise<StoredActivity[]> {
  let collection = db.activities.orderBy('timestamp').reverse();

  if (filters?.source) {
    collection = db.activities
      .where('[source+timestamp]')
      .between(
        [filters.source, filters.dateRange?.start ?? new Date(0)],
        [filters.source, filters.dateRange?.end ?? new Date()],
        true,
        true
      )
      .reverse();
  } else if (filters?.dateRange) {
    collection = db.activities
      .where('timestamp')
      .between(filters.dateRange.start, filters.dateRange.end, true, true)
      .reverse();
  }

  let results = await collection.toArray();

  if (filters?.types && filters.types.length > 0) {
    results = results.filter((a) => filters.types!.includes(a.type));
  }

  if (filters?.conversationId) {
    results = results.filter((a) => a.conversationId === filters.conversationId);
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    results = results.filter(
      (a) =>
        a.conversationTitle?.toLowerCase().includes(search) ||
        a.metadata.messagePreview?.toLowerCase().includes(search) ||
        a.metadata.artifactTitle?.toLowerCase().includes(search) ||
        a.metadata.toolName?.toLowerCase().includes(search)
    );
  }

  return results;
}

export async function getActivityCount(): Promise<number> {
  return db.activities.count();
}

export async function getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
  return db.dailyStats
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

async function updateDailyStatsFromActivity(
  dateStr: string,
  activity: StoredActivity
): Promise<void> {
  const existing = await db.dailyStats.get(dateStr);

  const stats: DailyStats = existing ?? {
    date: dateStr,
    inputTokens: 0,
    outputTokens: 0,
    messageCount: 0,
    artifactCount: 0,
    toolUseCount: 0,
    modelUsage: {},
  };

  if (activity.tokens) {
    stats.inputTokens += activity.tokens.inputTokens;
    stats.outputTokens += activity.tokens.outputTokens;
  }

  if (activity.type === 'message_sent' || activity.type === 'message_received') {
    stats.messageCount += 1;
  }

  if (activity.type === 'artifact_created') {
    stats.artifactCount += 1;
  }

  if (activity.type === 'tool_use') {
    stats.toolUseCount += 1;
  }

  if (activity.model) {
    stats.modelUsage[activity.model] = (stats.modelUsage[activity.model] ?? 0) + 1;
  }

  await db.dailyStats.put(stats);
}

export async function updateDailyStats(
  date: string,
  updates: Partial<Omit<DailyStats, 'date'>>
): Promise<void> {
  const existing = await db.dailyStats.get(date);

  if (existing) {
    await db.dailyStats.update(date, updates);
  } else {
    await db.dailyStats.add({
      date,
      inputTokens: 0,
      outputTokens: 0,
      messageCount: 0,
      artifactCount: 0,
      toolUseCount: 0,
      modelUsage: {},
      ...updates,
    });
  }
}

export async function clearActivities(): Promise<void> {
  await db.transaction('rw', [db.activities, db.dailyStats], async () => {
    await db.activities.clear();
    await db.dailyStats.clear();
  });
}
