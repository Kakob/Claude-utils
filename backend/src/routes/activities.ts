import { FastifyPluginAsync } from 'fastify';
import { db, activities, dailyStats, type NewActivity } from '../db/index.js';
import { eq, desc, and, gte, lte, inArray, sql, count, or, ilike } from 'drizzle-orm';
import { z } from 'zod';

const activitySchema = z.object({
  id: z.string(),
  type: z.enum(['message_sent', 'message_received', 'artifact_created', 'code_block', 'tool_use', 'tool_result']),
  source: z.enum(['claude.ai', 'extension']),
  conversationId: z.string().nullable().optional(),
  conversationTitle: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  timestamp: z.string().or(z.date()),
  tokens: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    cacheCreationTokens: z.number().optional(),
    cacheReadTokens: z.number().optional(),
  }).nullable().optional(),
  metadata: z.object({
    messageRole: z.enum(['user', 'assistant']).optional(),
    messagePreview: z.string().optional(),
    fullContent: z.string().optional(),
    userMessage: z.string().optional(),
    artifactTitle: z.string().optional(),
    artifactType: z.string().optional(),
    codeLanguage: z.string().optional(),
    codeContent: z.string().optional(),
    toolName: z.string().optional(),
  }).default({}),
});

const filtersSchema = z.object({
  source: z.enum(['claude.ai', 'extension']).optional(),
  types: z.string().optional(), // comma-separated
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  conversationId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

export const activitiesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/activities - List activities with filters
  fastify.get('/', async (request, reply) => {
    const filters = filtersSchema.parse(request.query);
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters.source) {
      conditions.push(eq(activities.source, filters.source));
    }

    if (filters.startDate) {
      conditions.push(gte(activities.timestamp, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      conditions.push(lte(activities.timestamp, new Date(filters.endDate)));
    }

    if (filters.conversationId) {
      conditions.push(eq(activities.conversationId, filters.conversationId));
    }

    // Build query
    let query = db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(filters.limit)
      .offset(filters.offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    let results = await query;

    // Filter by types (in-memory, since it's an array)
    if (filters.types) {
      const typeList = filters.types.split(',') as typeof results[0]['type'][];
      results = results.filter((a) => typeList.includes(a.type));
    }

    // Filter by search (in-memory)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.conversationTitle?.toLowerCase().includes(search) ||
          a.metadata?.messagePreview?.toLowerCase().includes(search) ||
          a.metadata?.artifactTitle?.toLowerCase().includes(search) ||
          a.metadata?.toolName?.toLowerCase().includes(search)
      );
    }

    return results.map(toApiActivity);
  });

  // POST /api/activities - Create activity
  fastify.post('/', async (request, reply) => {
    const body = activitySchema.parse(request.body);
    const timestamp = new Date(body.timestamp);

    const newActivity: NewActivity = {
      id: body.id,
      type: body.type,
      source: body.source,
      conversationId: body.conversationId ?? null,
      conversationTitle: body.conversationTitle ?? null,
      model: body.model ?? null,
      timestamp,
      tokens: body.tokens ?? null,
      metadata: body.metadata,
    };

    await db.insert(activities).values(newActivity).onConflictDoNothing();

    // Update daily stats
    const dateStr = timestamp.toISOString().split('T')[0];
    await updateDailyStatsFromActivity(dateStr, newActivity);

    return { id: newActivity.id };
  });

  // DELETE /api/activities - Clear all activities
  fastify.delete('/', async (request, reply) => {
    await db.delete(activities);
    await db.delete(dailyStats);
    return { success: true };
  });

  // GET /api/activities/count - Get activity count
  fastify.get('/count', async () => {
    const [{ total }] = await db.select({ total: count() }).from(activities);
    return { count: total };
  });
};

function toApiActivity(activity: typeof activities.$inferSelect) {
  return {
    id: activity.id,
    type: activity.type,
    source: activity.source,
    conversationId: activity.conversationId,
    conversationTitle: activity.conversationTitle,
    model: activity.model,
    timestamp: activity.timestamp.toISOString(),
    tokens: activity.tokens,
    metadata: activity.metadata,
  };
}

async function updateDailyStatsFromActivity(dateStr: string, activity: NewActivity): Promise<void> {
  const [existing] = await db.select().from(dailyStats).where(eq(dailyStats.date, dateStr));

  const stats = existing ?? {
    date: dateStr,
    inputTokens: 0,
    outputTokens: 0,
    messageCount: 0,
    artifactCount: 0,
    toolUseCount: 0,
    modelUsage: {},
  };

  // Update token counts
  if (activity.tokens) {
    stats.inputTokens += activity.tokens.inputTokens;
    stats.outputTokens += activity.tokens.outputTokens;
  }

  // Update activity counts
  if (activity.type === 'message_sent' || activity.type === 'message_received') {
    stats.messageCount += 1;
  }
  if (activity.type === 'artifact_created') {
    stats.artifactCount += 1;
  }
  if (activity.type === 'tool_use') {
    stats.toolUseCount += 1;
  }

  // Update model usage
  if (activity.model) {
    stats.modelUsage[activity.model] = (stats.modelUsage[activity.model] ?? 0) + 1;
  }

  // Upsert stats
  await db
    .insert(dailyStats)
    .values(stats)
    .onConflictDoUpdate({
      target: dailyStats.date,
      set: {
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
        messageCount: stats.messageCount,
        artifactCount: stats.artifactCount,
        toolUseCount: stats.toolUseCount,
        modelUsage: stats.modelUsage,
      },
    });
}
