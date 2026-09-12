import { Router } from 'express';
import * as ctrl from './note.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createNoteSchema, updateNoteSchema, noteIdSchema, getNotesSchema } from './note.validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', validate(createNoteSchema), ctrl.createNote);
router.get('/', validate(getNotesSchema), ctrl.getNotes);
router.get('/:id', validate(noteIdSchema), ctrl.getNote);
router.put('/:id', validate(updateNoteSchema), ctrl.updateNote);
router.delete('/:id', validate(noteIdSchema), ctrl.deleteNote);

export default router;
