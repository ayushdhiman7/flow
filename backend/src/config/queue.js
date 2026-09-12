import { Queue, Worker } from 'bullmq';
import { redis } from './redis.js';
import { env } from './env.js';

export const emailQueue = new Queue('email', { connection: redis });
export const notificationQueue = new Queue('notifications', { connection: redis });

export async function addEmailJob(name, data) {
  await emailQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
}

export async function addNotificationJob(name, data) {
  await notificationQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
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