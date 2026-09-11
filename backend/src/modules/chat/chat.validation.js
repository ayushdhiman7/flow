import { z } from 'zod';
import { CHANNEL_TYPES } from '../../utils/constants.js';

export const createChannelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    type: z.enum(Object.values(CHANNEL_TYPES)).default(CHANNEL_TYPES.CHANNEL),
    memberIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
  }),
});

export const getMessagesSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
    replyTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  }),
});

export const channelIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
});