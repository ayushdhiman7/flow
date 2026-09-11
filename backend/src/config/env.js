import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().min(1).default('mongodb://localhost:27017/flow'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5242880),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success && process.env.NODE_ENV !== 'test') {
  console.error('Env validation failed:', parsed.error?.format());
  throw new Error('Invalid environment variables');
}
export const env = parsed.success ? parsed.data : {
  NODE_ENV: 'test',
  PORT: 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/flow_test',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'test-access-secret-key-32-chars-long-xxx',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-32-chars-long-yy',
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '7d',
  CORS_ORIGIN: 'http://localhost:5173',
  UPLOAD_DIR: './uploads',
  MAX_FILE_SIZE: 5242880,
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX: 100,
};

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';