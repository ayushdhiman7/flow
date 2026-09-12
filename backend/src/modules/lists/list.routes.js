import { Router } from 'express';
import * as ctrl from './list.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createListSchema, updateListSchema, listIdSchema, reorderListsSchema } from './list.validation.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Lists
 *   description: List CRUD within board
 */

router.use(authenticate);

/**
 * @swagger
 * /api/boards/{boardId}/lists:
 *   post:
 *     summary: Create list
 *     tags: [Lists]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: boardId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201: { description: Created }
 *   get:
 *     summary: List lists
 *     tags: [Lists]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: boardId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: List }
 */
router.post('/', authorizeWorkspace('member', 'admin', 'owner'), validate(createListSchema), ctrl.createList);
router.get('/', authorizeWorkspace('member', 'admin', 'owner'), ctrl.getLists);

/**
 * @swagger
 * /api/boards/{boardId}/lists/{id}:
 *   get:
 *     summary: Get list
 *     tags: [Lists]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: boardId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: List }
 *   put:
 *     summary: Update list (admin/owner)
 *     tags: [Lists]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: boardId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete list (admin/owner)
 *     tags: [Lists]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: boardId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:id', validate(listIdSchema), ctrl.getList);
router.put('/:id', validate(listIdSchema), validate(updateListSchema), authorizeWorkspace('admin', 'owner'), ctrl.updateList);
router.delete('/:id', validate(listIdSchema), authorizeWorkspace('admin', 'owner'), ctrl.deleteList);

/**
 * @swagger
 * /api/boards/{boardId}/lists/reorder:
 *   post:
 *     summary: Reorder lists (admin/owner, transaction)
 *     tags: [Lists]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: boardId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listIds]
 *             properties:
 *               listIds: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Reordered }
 */
router.post('/reorder', authorizeWorkspace('admin', 'owner'), validate(reorderListsSchema), ctrl.reorderLists);

export default router;