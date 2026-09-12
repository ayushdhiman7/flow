import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

export async function connectRedis() {
  if (['connect', 'ready', 'connecting'].includes(redis.status)) return;
  await redis.connect();
}

export async function disconnectRedis() {
  if (['end', 'close'].includes(redis.status)) return;
  try {
    await redis.quit();
  } catch {}
}

export function cacheKey(...parts) {
  return `flow:${parts.join(':')}`;
}

export async function getCache(key) {
  try {
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export async function setCache(key, value, ttl = 300) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {}
}

export async function delCache(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch {}
}