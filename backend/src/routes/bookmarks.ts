import { FastifyPluginAsync } from 'fastify';
import { db, bookmarks, messages, conversations, entityTags } from '../db/index.js';
import { eq, and, desc, count } from 'drizzle-orm';

function toApiBookmark(
  row: typeof bookmarks.$inferSelect,
  message?: typeof messages.$inferSelect,
  conversation?: typeof conversations.$inferSelect
) {
  return {
    id: row.id,
    conversationId: row.conversationId,
    conversationName: conversation?.name || null,
    messageId: row.messageId,
    messageSender: message?.sender || null,
    messagePreview: message?.text?.slice(0, 150) || '',
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export const bookmarkRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/bookmarks - List bookmarks with pagination
  fastify.get<{
    Querystring: {
      conversationId?: string;
      limit?: string;
      offset?: string;
    };
  }>('/', async (request) => {
    const { conversationId, limit: limitStr, offset: offsetStr } = request.query;
    const limit = parseInt(limitStr || '50', 10);
    const offset = parseInt(offsetStr || '0', 10);

    const conditions = [];
    if (conversationId) {
      conditions.push(eq(bookmarks.conversationId, conversationId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          bookmark: bookmarks,
          message: messages,
          conversation: conversations,
        })
        .from(bookmarks)
        .leftJoin(messages, eq(bookmarks.messageId, messages.id))
        .leftJoin(conversations, eq(bookmarks.conversationId, conversations.id))
        .where(where)
        .orderBy(desc(bookmarks.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(bookmarks).where(where),
    ]);

    return {
      data: rows.map((r) => toApiBookmark(r.bookmark, r.message!, r.conversation!)),
      pagination: {
        total: Number(total),
        limit,
        offset,
        hasMore: offset + rows.length < Number(total),
      },
    };
  });

  // GET /api/bookmarks/check/:messageId - Check if message is bookmarked
  fastify.get<{ Params: { messageId: string } }>(
    '/check/:messageId',
    async (request) => {
      const { messageId } = request.params;
      const [row] = await db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(eq(bookmarks.messageId, messageId))
        .limit(1);

      return {
        bookmarked: !!row,
        bookmarkId: row?.id || undefined,
      };
    }
  );

  // GET /api/bookmarks/conversation/:conversationId - Get bookmarks for a conversation
  fastify.get<{ Params: { conversationId: string } }>(
    '/conversation/:conversationId',
    async (request) => {
      const { conversationId } = request.params;
      const rows = await db
        .select({
          bookmark: bookmarks,
          message: messages,
        })
        .from(bookmarks)
        .leftJoin(messages, eq(bookmarks.messageId, messages.id))
        .where(eq(bookmarks.conversationId, conversationId))
        .orderBy(desc(bookmarks.createdAt));

      return rows.map((r) => ({
        id: r.bookmark.id,
        conversationId: r.bookmark.conversationId,
        messageId: r.bookmark.messageId,
        messageSender: r.message?.sender || null,
        messagePreview: r.message?.text?.slice(0, 150) || '',
        note: r.bookmark.note,
        createdAt: r.bookmark.createdAt.toISOString(),
      }));
    }
  );

  // GET /api/bookmarks/:id - Get single bookmark
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const [row] = await db
      .select({
        bookmark: bookmarks,
        message: messages,
        conversation: conversations,
      })
      .from(bookmarks)
      .leftJoin(messages, eq(bookmarks.messageId, messages.id))
      .leftJoin(conversations, eq(bookmarks.conversationId, conversations.id))
      .where(eq(bookmarks.id, id))
      .limit(1);

    if (!row) {
      return reply.status(404).send({ error: 'Bookmark not found' });
    }

    return toApiBookmark(row.bookmark, row.message!, row.conversation!);
  });

  // POST /api/bookmarks - Create bookmark
  fastify.post<{
    Body: {
      conversationId: string;
      messageId: string;
      note?: string;
    };
  }>('/', async (request, reply) => {
    const { conversationId, messageId, note } = request.body;

    if (!conversationId || !messageId) {
      return reply.status(400).send({ error: 'conversationId and messageId are required' });
    }

    const id = crypto.randomUUID();
    const [row] = await db
      .insert(bookmarks)
      .values({ id, conversationId, messageId, note: note || null })
      .onConflictDoNothing({ target: bookmarks.messageId })
      .returning();

    if (!row) {
      // Already bookmarked
      const [existing] = await db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.messageId, messageId))
        .limit(1);
      return existing;
    }

    return {
      id: row.id,
      conversationId: row.conversationId,
      messageId: row.messageId,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    };
  });

  // PUT /api/bookmarks/:id - Update bookmark note
  fastify.put<{
    Params: { id: string };
    Body: { note?: string };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { note } = request.body;

    const [row] = await db
      .update(bookmarks)
      .set({ note: note ?? null })
      .where(eq(bookmarks.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: 'Bookmark not found' });
    }

    return {
      id: row.id,
      conversationId: row.conversationId,
      messageId: row.messageId,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    };
  });

  // DELETE /api/bookmarks/:id - Delete bookmark
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // Clean up entity tags
    await db
      .delete(entityTags)
      .where(
        and(
          eq(entityTags.entityId, id),
          eq(entityTags.entityType, 'bookmark')
        )
      );

    const [deleted] = await db.delete(bookmarks).where(eq(bookmarks.id, id)).returning();

    if (!deleted) {
      return reply.status(404).send({ error: 'Bookmark not found' });
    }

    return { success: true };
  });
};
