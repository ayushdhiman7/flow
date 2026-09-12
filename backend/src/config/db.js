import mongoose from 'mongoose';
import { env } from './env.js';

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
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (err.message.includes('whitelist') || err.message.includes('Atlas') || err.name === 'MongooseServerSelectionError') {
      console.error('\n → Atlas IP not whitelisted. Fix: Atlas Console → Network Access → Add IP 0.0.0.0/0 (dev) or use local Mongo:');
      console.error('   docker run -d -p 27017:27017 --name flow-mongo mongo:7');
      console.error('   or: docker compose up mongo redis -d');
      console.error('   then set MONGO_URI=mongodb://localhost:27017/flow in backend/.env\n');
    }
    throw err;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB disconnected');
}

export function getConnectionStatus() {
  return mongoose.connection.readyState === 1;
}