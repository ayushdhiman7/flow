import { Router } from 'express';
import * as ctrl from './card.controller.js';
import { authenticate, authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createCardSchema, updateCardSchema, moveCardSchema, addAssigneesSchema, cardIdSchema } from './card.validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', validate(createCardSchema), ctrl.createCard);
router.get('/', ctrl.getCards);
router.get('/:id', validate(cardIdSchema), ctrl.getCard);
router.put('/:id', validate(cardIdSchema), validate(updateCardSchema), ctrl.updateCard);
router.patch('/:id/move', validate(cardIdSchema), validate(moveCardSchema), ctrl.moveCard);
router.delete('/:id', validate(cardIdSchema), ctrl.deleteCard);
router.post('/:id/assignees', validate(cardIdSchema), validate(addAssigneesSchema), ctrl.addAssignees);
router.delete('/:id/assignees/:assigneeId', validate(cardIdSchema), ctrl.removeAssignee);

export default router;