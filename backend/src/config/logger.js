import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, json, errors, colorize, printf } = winston.format;

const prettyFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'flow-api' },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'production' ? combine(timestamp(), json()) : combine(colorize(), timestamp(), prettyFormat),
    }),
  ],
});

// Add file transports in production
if (env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export const stream = {
  write(message) {
    logger.http(message.trim());
  },
};
