import { z } from 'zod';

export const createBoardSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(500).optional(),
    background: z.string().optional(),
    visibility: z.enum(['private', 'workspace']).default('private'),
  }),
});

export const updateBoardSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(500).optional(),
    background: z.string().optional(),
    visibility: z.enum(['private', 'workspace']).optional(),
  }),
});

export const boardIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
});

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});