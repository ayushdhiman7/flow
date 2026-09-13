import { Queue, Worker } from 'bullmq';
import { redis } from './redis.js';
import { env } from './env.js';
import { logger } from './logger.js';

export const emailQueue = new Queue('email', { connection: redis });
export const notificationQueue = new Queue('notifications', { connection: redis });

export async function addEmailJob(name, data) {
  try {
    await emailQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  } catch (err) {
    // jobs must never break the request path when Redis is down
    logger.warn(`addEmailJob skipped (Redis down): ${err?.message || err}`);
  }
}

export async function addNotificationJob(name, data) {
  try {
    await notificationQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  } catch (err) {
    // jobs must never break the request path when Redis is down
    logger.warn(`addNotificationJob skipped (Redis down): ${err?.message || err}`);
  }
}

export function createWorker(queueName, processor) {
  return new Worker(queueName, processor, {
    connection: redis,
    concurrency: 5,
  });
}

export async function closeQueues() {
  await emailQueue.close();
  await notificationQueue.close();
}