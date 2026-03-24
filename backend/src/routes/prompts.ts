import { FastifyPluginAsync } from 'fastify';
import { db, prompts, entityTags } from '../db/index.js';
import { eq, and, ilike, or, desc, sql, count } from 'drizzle-orm';

function toApiPrompt(row: typeof prompts.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    description: row.description,
    folder: row.folder,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    usageCount: row.usageCount,
  };
}

export const promptRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/prompts - List prompts with pagination and filters
  fastify.get<{
    Querystring: {
      folder?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };
  }>('/', async (request) => {
    const { folder, search, limit: limitStr, offset: offsetStr } = request.query;
    const limit = parseInt(limitStr || '50', 10);
    const offset = parseInt(offsetStr || '0', 10);

    const conditions = [];
    if (folder) {
      conditions.push(eq(prompts.folder, folder));
    }
    if (search) {
      conditions.push(
        or(
          ilike(prompts.title, `%${search}%`),
          ilike(prompts.content, `%${search}%`),
          ilike(prompts.description, `%${search}%`)
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(prompts)
        .where(where)
        .orderBy(desc(prompts.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(prompts).where(where),
    ]);

    return {
      data: rows.map(toApiPrompt),
      pagination: {
        total: Number(total),
        limit,
        offset,
        hasMore: offset + rows.length < Number(total),
      },
    };
  });

  // GET /api/prompts/folders - List distinct folders
  fastify.get('/folders', async () => {
    const rows = await db
      .selectDistinct({ folder: prompts.folder })
      .from(prompts)
      .where(sql`${prompts.folder} IS NOT NULL AND ${prompts.folder} != ''`)
      .orderBy(prompts.folder);

    return rows.map((r) => r.folder).filter(Boolean);
  });

  // GET /api/prompts/:id - Get single prompt
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const [row] = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);

    if (!row) {
      return reply.status(404).send({ error: 'Prompt not found' });
    }

    return toApiPrompt(row);
  });

  // POST /api/prompts - Create prompt
  fastify.post<{
    Body: {
      title: string;
      content: string;
      description?: string;
      folder?: string;
      tags?: string[];
    };
  }>('/', async (request, reply) => {
    const { title, content, description, folder, tags: tagList } = request.body;

    if (!title?.trim() || !content?.trim()) {
      return reply.status(400).send({ error: 'Title and content are required' });
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const [row] = await db
      .insert(prompts)
      .values({
        id,
        title: title.trim(),
        content: content.trim(),
        description: description?.trim() || '',
        folder: folder?.trim() || null,
        tags: tagList || [],
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toApiPrompt(row);
  });

  // PUT /api/prompts/:id - Update prompt
  fastify.put<{
    Params: { id: string };
    Body: {
      title?: string;
      content?: string;
      description?: string;
      folder?: string;
      tags?: string[];
    };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { title, content, description, folder, tags: tagList } = request.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (description !== undefined) updates.description = description.trim();
    if (folder !== undefined) updates.folder = folder?.trim() || null;
    if (tagList !== undefined) updates.tags = tagList;

    const [row] = await db
      .update(prompts)
      .set(updates)
      .where(eq(prompts.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: 'Prompt not found' });
    }

    return toApiPrompt(row);
  });

  // DELETE /api/prompts/:id - Delete prompt and its entity tags
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // Clean up entity tags
    await db
      .delete(entityTags)
      .where(
        and(
          eq(entityTags.entityId, id),
          eq(entityTags.entityType, 'prompt')
        )
      );

    const [deleted] = await db.delete(prompts).where(eq(prompts.id, id)).returning();

    if (!deleted) {
      return reply.status(404).send({ error: 'Prompt not found' });
    }

    return { success: true };
  });

  // POST /api/prompts/:id/use - Increment usage count
  fastify.post<{ Params: { id: string } }>('/:id/use', async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .update(prompts)
      .set({
        usageCount: sql`${prompts.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: 'Prompt not found' });
    }

    return toApiPrompt(row);
  });
};
