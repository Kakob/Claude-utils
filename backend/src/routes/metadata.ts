import { FastifyPluginAsync } from 'fastify';
import { db, metadata } from '../db/index.js';
import { eq } from 'drizzle-orm';

export const metadataRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/metadata/:key - Get metadata by key
  fastify.get<{ Params: { key: string } }>('/:key', async (request, reply) => {
    const { key } = request.params;

    const [result] = await db
      .select()
      .from(metadata)
      .where(eq(metadata.key, key))
      .limit(1);

    if (!result) {
      return reply.status(404).send({ error: 'Metadata not found' });
    }

    return { key: result.key, value: result.value };
  });

  // PUT /api/metadata/:key - Set metadata
  fastify.put<{ Params: { key: string } }>('/:key', async (request, reply) => {
    const { key } = request.params;
    const { value } = request.body as { value: unknown };

    await db
      .insert(metadata)
      .values({ key, value })
      .onConflictDoUpdate({
        target: metadata.key,
        set: { value },
      });

    return { success: true };
  });

  // DELETE /api/metadata/:key - Delete metadata
  fastify.delete<{ Params: { key: string } }>('/:key', async (request, reply) => {
    const { key } = request.params;
    await db.delete(metadata).where(eq(metadata.key, key));
    return { success: true };
  });

  // GET /api/metadata - Get all metadata
  fastify.get('/', async () => {
    const results = await db.select().from(metadata);
    return results.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, unknown>);
  });

  // DELETE /api/metadata - Clear all metadata
  fastify.delete('/', async () => {
    await db.delete(metadata);
    return { success: true };
  });
};
