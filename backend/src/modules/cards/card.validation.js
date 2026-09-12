import { z } from 'zod';

export const createCardSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    position: z.number().optional(),
    assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
  }),
});

export const updateCardSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    startDate: z.string().datetime().nullable().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const moveCardSchema = z.object({
  body: z.object({
    listId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    position: z.number(),
  }),
});

export const addAssigneesSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
  }),
});

export const addCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
  }),
});

export const cardIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
});

export const getCardsSchema = z.object({
  params: z.object({ listId: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
  query: z.object({
    search: z.string().max(100).optional(),
    cursor: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
  }).optional(),
});

export const commentIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
    commentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});