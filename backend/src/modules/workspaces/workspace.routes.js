import { Router } from 'express';
import * as ctrl from './workspace.controller.js';
import { authenticate, authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createWorkspaceSchema, updateWorkspaceSchema, inviteMemberSchema, updateMemberSchema, workspaceIdSchema, memberIdSchema } from './workspace.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createWorkspaceSchema), ctrl.createWorkspace);
router.get('/', ctrl.getWorkspaces);
router.get('/:id', validate(workspaceIdSchema), ctrl.getWorkspace);
router.put('/:id', validate(workspaceIdSchema), validate(updateWorkspaceSchema), ctrl.updateWorkspace);
router.delete('/:id', validate(workspaceIdSchema), ctrl.deleteWorkspace);

router.post('/:id/members', validate(workspaceIdSchema), validate(inviteMemberSchema), ctrl.inviteMember);
router.put('/:id/members/:userId', validate(memberIdSchema), validate(updateMemberSchema), ctrl.updateMember);
router.delete('/:id/members/:userId', validate(memberIdSchema), ctrl.removeMember);

export default router;