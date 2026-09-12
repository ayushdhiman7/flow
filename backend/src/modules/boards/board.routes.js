import { Router } from 'express';
import * as ctrl from './board.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createBoardSchema, updateBoardSchema, boardIdSchema, addMemberSchema } from './board.validation.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Boards
 *   description: Board CRUD within workspace
 */

router.use(authenticate);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards:
 *   post:
 *     summary: Create board
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               visibility: { type: string, enum: [private, workspace] }
 *     responses:
 *       201: { description: Board created }
 *   get:
 *     summary: List boards
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: List }
 */
router.post('/', authorizeWorkspace('member', 'admin', 'owner'), validate(createBoardSchema), ctrl.createBoard);
router.get('/', authorizeWorkspace('member', 'admin', 'owner'), ctrl.getBoards);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards/{id}:
 *   get:
 *     summary: Get board
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Board }
 */
router.get('/:id', validate(boardIdSchema), ctrl.getBoard);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards/{id}/full:
 *   get:
 *     summary: Get board with lists and cards (aggregation)
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Full board }
 */
router.get('/:id/full', validate(boardIdSchema), ctrl.getBoardFull);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards/{id}/stats:
 *   get:
 *     summary: Get board stats (aggregation)
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Stats }
 */
router.get('/:id/stats', validate(boardIdSchema), ctrl.getBoardStats);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards/{id}:
 *   put:
 *     summary: Update board (admin/owner)
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete board (admin/owner)
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
router.put('/:id', validate(boardIdSchema), validate(updateBoardSchema), authorizeWorkspace('admin', 'owner'), ctrl.updateBoard);
router.delete('/:id', validate(boardIdSchema), authorizeWorkspace('admin', 'owner'), ctrl.deleteBoard);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards/{id}/members:
 *   post:
 *     summary: Add board member (admin/owner)
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Member added }
 */
router.post('/:id/members', validate(boardIdSchema), validate(addMemberSchema), authorizeWorkspace('admin', 'owner'), ctrl.addMember);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards/{id}/members/{userId}:
 *   delete:
 *     summary: Remove board member
 *     tags: [Boards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: userId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Removed }
 */
router.delete('/:id/members/:userId', validate(boardIdSchema), authorizeWorkspace('admin', 'owner'), ctrl.removeMember);

export default router;