import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

// Trim accidental whitespace/newlines from dashboard-pasted URLs.
const redisUrl = String(env.REDIS_URL || '').trim();

function redisErrorMessage(err) {
  // ioredis wraps DNS/TLS failures in AggregateError — unwrap the real causes.
  if (err?.errors?.length) return err.errors.map(e => e?.message || String(e)).join('; ');
  return err?.message || String(err);
}

export const redis = env.REDIS_ENABLED ? new Redis(redisUrl, {
  maxRetriesPerRequest: null, // required when shared with BullMQ
  enableOfflineQueue: false, // fail fast while disconnected so cache helpers degrade instead of hanging
  lazyConnect: true,
  retryStrategy(times) {
    // capped exponential backoff: 200ms, 400ms, ... max 5s, retry forever
    return Math.min(times * 200, 5000);
  },
}) : null;

redis?.on('connect', () => logger.info('Redis connected'));
redis?.on('error', (err) => logger.error(`Redis error: ${redisErrorMessage(err)}`));

export async function connectRedis() {
  if (!redis) return false;
  if (['connect', 'ready', 'connecting'].includes(redis.status)) return true;
  try {
    // don't block boot forever: give Redis 10s, then run degraded (no cache/jobs)
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connect timeout (10s)')), 10000)),
    ]);
    return true;
  } catch (err) {
    logger.warn(`Redis unavailable, running degraded without cache/jobs: ${err?.message || err}`);
    return false;
  }
}

export async function disconnectRedis() {
  if (!redis) return;
  if (['end', 'close'].includes(redis.status)) return;
  try {
    await redis.quit();
  } catch {}
}

export function cacheKey(...parts) {
  return `flow:${parts.join(':')}`;
}

export async function getCache(key) {
  if (!redis) return null;
  try {
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export async function setCache(key, value, ttl = 300) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {}
}

export async function delCache(pattern) {
  if (!redis) return;
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (err) {
    logger.warn('delCache failed', { pattern, error: err.message });
  }
}