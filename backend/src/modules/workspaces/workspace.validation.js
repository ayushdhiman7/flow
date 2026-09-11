import { z } from 'zod';
import { ROLES } from '../../utils/constants.js';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/).optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    settings: z.object({
      isPublic: z.boolean().optional(),
      allowMemberInvite: z.boolean().optional(),
      defaultBoardVisibility: z.enum(['private', 'workspace']).optional(),
    }).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum([ROLES.ADMIN, ROLES.MEMBER]).default(ROLES.MEMBER),
  }),
});

export const updateMemberSchema = z.object({
  body: z.object({
    role: z.enum([ROLES.ADMIN, ROLES.MEMBER]),
  }),
});

export const workspaceIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
});

export const memberIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});