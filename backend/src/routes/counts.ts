import { FastifyPluginAsync } from 'fastify';
import { db, conversations, messages, activities } from '../db/index.js';
import { count } from 'drizzle-orm';

export const countsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/counts - Get all counts
  fastify.get('/', async () => {
    const [[convCount], [msgCount], [actCount]] = await Promise.all([
      db.select({ total: count() }).from(conversations),
      db.select({ total: count() }).from(messages),
      db.select({ total: count() }).from(activities),
    ]);

    return {
      conversations: convCount.total,
      messages: msgCount.total,
      activities: actCount.total,
    };
  });
};
