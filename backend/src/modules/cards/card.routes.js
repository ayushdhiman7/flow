import { Router } from 'express';
import * as ctrl from './card.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createCardSchema, updateCardSchema, moveCardSchema, addAssigneesSchema, cardIdSchema, getCardsSchema } from './card.validation.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: Card CRUD with search, move, assignees
 */

router.use(authenticate);

/**
 * @swagger
 * /api/lists/{listId}/cards:
 *   post:
 *     summary: Create card
 *     tags: [Cards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: listId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Created }
 *   get:
 *     summary: List cards (paginated, search via text index + regex fallback)
 *     tags: [Cards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: listId, in: path, required: true, schema: { type: string } }
 *       - { name: search, in: query, schema: { type: string }, description: Search title/description }
 *       - { name: cursor, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: integer } }
 *     responses:
 *       200: { description: List }
 */
router.post('/', authorizeWorkspace('member', 'admin', 'owner'), validate(createCardSchema), ctrl.createCard);
router.get('/', authorizeWorkspace('member', 'admin', 'owner'), validate(getCardsSchema), ctrl.getCards);

/**
 * @swagger
 * /api/lists/{listId}/cards/{id}:
 *   get:
 *     summary: Get card
 *     tags: [Cards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: listId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Card }
 *   put:
 *     summary: Update card (admin/owner)
 *     tags: [Cards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: listId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete card (admin/owner)
 *     tags: [Cards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: listId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:id', validate(cardIdSchema), ctrl.getCard);
router.put('/:id', validate(cardIdSchema), validate(updateCardSchema), authorizeWorkspace('admin', 'owner'), ctrl.updateCard);
router.delete('/:id', validate(cardIdSchema), authorizeWorkspace('admin', 'owner'), ctrl.deleteCard);

/**
 * @swagger
 * /api/lists/{listId}/cards/{id}/move:
 *   patch:
 *     summary: Move card (transaction)
 *     tags: [Cards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: listId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listId, position]
 *             properties:
 *               listId: { type: string }
 *               position: { type: number }
 *     responses:
 *       200: { description: Moved }
 */
router.patch('/:id/move', validate(cardIdSchema), validate(moveCardSchema), authorizeWorkspace('admin', 'owner'), ctrl.moveCard);

/**
 * @swagger
 * /api/lists/{listId}/cards/{id}/assignees:
 *   post:
 *     summary: Add assignees (admin/owner)
 *     tags: [Cards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: listId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Assignees added }
 */
router.post('/:id/assignees', validate(cardIdSchema), validate(addAssigneesSchema), authorizeWorkspace('admin', 'owner'), ctrl.addAssignees);

/**
 * @swagger
 * /api/lists/{listId}/cards/{id}/assignees/{assigneeId}:
 *   delete:
 *     summary: Remove assignee
 *     tags: [Cards]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: listId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: assigneeId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Removed }
 */
router.delete('/:id/assignees/:assigneeId', validate(cardIdSchema), authorizeWorkspace('admin', 'owner'), ctrl.removeAssignee);

export default router;