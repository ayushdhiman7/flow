import { Router } from 'express';
import * as ctrl from './workspace.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeWorkspace, attachWorkspaceRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createWorkspaceSchema, updateWorkspaceSchema, inviteMemberSchema, updateMemberSchema, workspaceIdSchema, memberIdSchema, joinByCodeSchema, handleRequestSchema, workspaceRequestListSchema } from './workspace.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Workspaces
 *   description: Workspace CRUD and membership
 */

router.use(authenticate);

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Create workspace
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *     responses:
 *       201: { description: Created }
 *   get:
 *     summary: List workspaces
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     responses:
 *       200: { description: List }
 */
router.post('/', validate(createWorkspaceSchema), ctrl.createWorkspace);
router.get('/', ctrl.getWorkspaces);
router.post('/join-by-code', validate(joinByCodeSchema), ctrl.joinByCode);

/**
 * @swagger
 * /api/workspaces/{id}:
 *   get:
 *     summary: Get workspace by id
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Workspace }
 *   put:
 *     summary: Update workspace (owner only)
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete workspace (owner only)
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:id', validate(workspaceIdSchema), attachWorkspaceRole, authorizeWorkspace('member', 'admin', 'owner'), ctrl.getWorkspace);
router.put('/:id', validate(workspaceIdSchema), validate(updateWorkspaceSchema), authorizeWorkspace('owner'), ctrl.updateWorkspace);
router.delete('/:id', validate(workspaceIdSchema), authorizeWorkspace('owner'), ctrl.deleteWorkspace);

/**
 * @swagger
 * /api/workspaces/{id}/members:
 *   post:
 *     summary: Invite member (admin/owner)
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *               role: { type: string, enum: [admin, member] }
 *     responses:
 *       200: { description: Member invited }
 */
router.post('/:id/members', validate(workspaceIdSchema), validate(inviteMemberSchema), authorizeWorkspace('admin', 'owner'), ctrl.inviteMember);

/**
 * @swagger
 * /api/workspaces/{id}/members/{userId}:
 *   put:
 *     summary: Update member role (owner only)
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: userId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Role updated }
 *   delete:
 *     summary: Remove member
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: userId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Removed }
 */
router.put('/:id/members/:userId', validate(memberIdSchema), validate(updateMemberSchema), authorizeWorkspace('owner'), ctrl.updateMember);
router.delete('/:id/members/:userId', validate(memberIdSchema), attachWorkspaceRole, ctrl.removeMember);

// Join requests — owner approval flow
router.get('/:id/requests', validate(workspaceRequestListSchema), authorizeWorkspace('owner', 'admin'), ctrl.getJoinRequests);
router.post('/:id/requests/:requestId/handle', validate(handleRequestSchema), authorizeWorkspace('owner', 'admin'), ctrl.handleJoinRequest);

export default router;