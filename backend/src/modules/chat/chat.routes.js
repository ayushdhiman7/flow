import { Router } from 'express';
import * as ctrl from './chat.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createChannelSchema, sendMessageSchema, channelIdSchema, getMessagesSchema, createDMSchema, createDMByCodeSchema } from './chat.validation.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Channels and direct messages
 */

router.use(authenticate);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/channels:
 *   post:
 *     summary: Create channel
 *     tags: [Chat]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Channel created }
 *   get:
 *     summary: List channels
 *     tags: [Chat]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: List }
 */
router.post('/', authorizeWorkspace('member', 'admin', 'owner'), validate(createChannelSchema), ctrl.createChannel);
router.get('/', authorizeWorkspace('member', 'admin', 'owner'), ctrl.getChannels);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/channels/dm:
 *   post:
 *     summary: Create DM by userId
 *     tags: [Chat]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200: { description: DM created }
 */
router.post('/dm', authorizeWorkspace('member', 'admin', 'owner'), validate(createDMSchema), ctrl.createDM);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/channels/dm-by-code:
 *   post:
 *     summary: Create DM by chat code
 *     tags: [Chat]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatCode]
 *             properties:
 *               chatCode: { type: string }
 *     responses:
 *       200: { description: DM created }
 */
router.post('/dm-by-code', authorizeWorkspace('member', 'admin', 'owner'), validate(createDMByCodeSchema), ctrl.createDMByCode);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/channels/{id}:
 *   get:
 *     summary: Get channel
 *     tags: [Chat]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Channel }
 */
router.get('/:id', authorizeWorkspace('member', 'admin', 'owner'), validate(channelIdSchema), ctrl.getChannel);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/channels/{id}/messages:
 *   get:
 *     summary: Get messages (cursor pagination)
 *     tags: [Chat]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: cursor, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: integer } }
 *     responses:
 *       200: { description: Messages }
 *   post:
 *     summary: Send message
 *     tags: [Chat]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, maxLength: 5000 }
 *               replyTo: { type: string }
 *     responses:
 *       201: { description: Message sent }
 */
router.get('/:id/messages', authorizeWorkspace('member', 'admin', 'owner'), validate(channelIdSchema), validate(getMessagesSchema), ctrl.getMessages);
router.post('/:id/messages', authorizeWorkspace('member', 'admin', 'owner'), validate(channelIdSchema), validate(sendMessageSchema), ctrl.sendMessage);

export default router;