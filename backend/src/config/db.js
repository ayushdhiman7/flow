import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', { message: err.message, stack: err.stack });
    if (err.message.includes('whitelist') || err.message.includes('Atlas') || err.name === 'MongooseServerSelectionError') {
      logger.error('Atlas IP not whitelisted. Fix: Atlas Console → Network Access → Add IP 0.0.0.0/0 (dev) or use local Mongo: docker run -d -p 27017:27017 --name flow-mongo mongo:7 or docker compose up mongo redis -d then set MONGO_URI=mongodb://localhost:27017/flow in backend/.env');
    }
    throw err;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected');
}

export function getConnectionStatus() {
  return mongoose.connection.readyState === 1;
}