import { env } from '../config/env.js';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.path} - ${err.message}`, { stack: err.stack, status: err.status || 500 });

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ error: `${field} already exists` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  const status = err.status || 500;
  const message = env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message;

  res.status(status).json({ error: message });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}