import { Queue, Worker } from 'bullmq';
import { redis } from './redis.js';
import { logger } from './logger.js';

export const emailQueue = redis ? new Queue('email', { connection: redis }) : null;
export const notificationQueue = redis ? new Queue('notifications', { connection: redis }) : null;

export async function addEmailJob(name, data) {
  if (!emailQueue) return;
  try {
    await emailQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  } catch (err) {
    // jobs must never break the request path when Redis is down
    logger.warn(`addEmailJob skipped (Redis down): ${err?.message || err}`);
  }
}

export async function addNotificationJob(name, data) {
  if (!notificationQueue) return;
  try {
    await notificationQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  } catch (err) {
    // jobs must never break the request path when Redis is down
    logger.warn(`addNotificationJob skipped (Redis down): ${err?.message || err}`);
  }
}

export function createWorker(queueName, processor) {
  if (!redis) return null;
  return new Worker(queueName, processor, {
    connection: redis,
    concurrency: 5,
  });
}

export async function closeQueues() {
  await Promise.all([emailQueue?.close(), notificationQueue?.close()]);
}