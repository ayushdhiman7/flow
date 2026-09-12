import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().max(10000).optional().default(''),
    isPinned: z.boolean().optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
  }),
  params: z.object({ workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().max(10000).optional(),
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
  }),
  params: z.object({
    workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

export const noteIdSchema = z.object({
  params: z.object({
    workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

export const getNotesSchema = z.object({
  params: z.object({ workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
  query: z.object({
    search: z.string().max(100).optional(),
    isPinned: z.enum(['true','false']).optional(),
    isArchived: z.enum(['true','false']).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    cursor: z.string().optional(),
  }).optional(),
});
