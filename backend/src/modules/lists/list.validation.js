import { z } from 'zod';

export const createListSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    position: z.number().optional(),
  }),
});

export const updateListSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    position: z.number().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const listIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
});

export const reorderListsSchema = z.object({
  body: z.object({
    listIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
  }),
});