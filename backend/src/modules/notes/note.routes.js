import { Router } from 'express';
import * as ctrl from './note.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createNoteSchema, updateNoteSchema, noteIdSchema, getNotesSchema } from './note.validation.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Notes with text search
 */

router.use(authenticate);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/notes:
 *   post:
 *     summary: Create note
 *     tags: [Notes]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               isPinned: { type: boolean }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Note created }
 *   get:
 *     summary: List notes (text search)
 *     tags: [Notes]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: search, in: query, schema: { type: string } }
 *       - { name: isPinned, in: query, schema: { type: string, enum: [true, false] } }
 *       - { name: limit, in: query, schema: { type: integer } }
 *     responses:
 *       200: { description: Notes }
 */
router.post('/', authorizeWorkspace('member', 'admin', 'owner'), validate(createNoteSchema), ctrl.createNote);
router.get('/', authorizeWorkspace('member', 'admin', 'owner'), validate(getNotesSchema), ctrl.getNotes);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/notes/{id}:
 *   get:
 *     summary: Get note
 *     tags: [Notes]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Note }
 *   put:
 *     summary: Update note (author or admin/owner)
 *     tags: [Notes]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete note
 *     tags: [Notes]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: workspaceId, in: path, required: true, schema: { type: string } }
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:id', authorizeWorkspace('member', 'admin', 'owner'), validate(noteIdSchema), ctrl.getNote);
router.put('/:id', authorizeWorkspace('member', 'admin', 'owner'), validate(updateNoteSchema), ctrl.updateNote);
router.delete('/:id', authorizeWorkspace('member', 'admin', 'owner'), validate(noteIdSchema), ctrl.deleteNote);

export default router;
