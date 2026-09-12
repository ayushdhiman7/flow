import { ZodSchema } from 'zod';
import { AppError } from './error.js';

export function validate(schema) {
  return (req, res, next) => {
    const data = { body: req.body, query: req.query, params: req.params, cookies: req.cookies };
    const result = schema.safeParse(data);
    if (!result.success) {
      const details = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new AppError(`Validation failed: ${details}`, 400);
    }
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new AppError('Invalid query parameters', 400);
    }
    req.query = result.data;
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      throw new AppError('Invalid parameters', 400);
    }
    req.params = result.data;
    next();
  };
}