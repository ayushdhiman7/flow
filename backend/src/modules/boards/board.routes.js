import { Router } from 'express';
import * as ctrl from './board.controller.js';
import { authenticate, authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createBoardSchema, updateBoardSchema, boardIdSchema, addMemberSchema } from './board.validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', validate(createBoardSchema), ctrl.createBoard);
router.get('/', ctrl.getBoards);
router.get('/:id', validate(boardIdSchema), ctrl.getBoard);
router.get('/:id/full', validate(boardIdSchema), ctrl.getBoardFull);
router.get('/:id/stats', validate(boardIdSchema), ctrl.getBoardStats);
router.put('/:id', validate(boardIdSchema), validate(updateBoardSchema), ctrl.updateBoard);
router.delete('/:id', validate(boardIdSchema), ctrl.deleteBoard);
router.post('/:id/members', validate(boardIdSchema), validate(addMemberSchema), ctrl.addMember);
router.delete('/:id/members/:userId', validate(boardIdSchema), ctrl.removeMember);

export default router;