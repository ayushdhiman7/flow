import { Router } from 'express';
import * as ctrl from './list.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createListSchema, updateListSchema, listIdSchema, reorderListsSchema } from './list.validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', validate(createListSchema), ctrl.createList);
router.get('/', ctrl.getLists);
router.get('/:id', validate(listIdSchema), ctrl.getList);
router.put('/:id', validate(listIdSchema), validate(updateListSchema), ctrl.updateList);
router.delete('/:id', validate(listIdSchema), ctrl.deleteList);
router.post('/reorder', validate(reorderListsSchema), ctrl.reorderLists);

export default router;