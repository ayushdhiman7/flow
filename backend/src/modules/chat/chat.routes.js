import { Router } from 'express';
import * as ctrl from './chat.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeWorkspace } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createChannelSchema, sendMessageSchema, channelIdSchema, getMessagesSchema } from './chat.validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', validate(createChannelSchema), ctrl.createChannel);
router.get('/', ctrl.getChannels);
router.post('/dm', validate(channelIdSchema), ctrl.createDM);
router.get('/:id', validate(channelIdSchema), ctrl.getChannel);
router.get('/:id/messages', validate(channelIdSchema), validate(getMessagesSchema), ctrl.getMessages);
router.post('/:id/messages', validate(channelIdSchema), validate(sendMessageSchema), ctrl.sendMessage);

export default router;