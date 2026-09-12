import { Router } from 'express';
import * as ctrl from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from './auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);

router.get('/me', authenticate, ctrl.me);
router.put('/me', authenticate, validate(updateProfileSchema), ctrl.updateProfile);
router.put('/me/password', authenticate, validate(changePasswordSchema), ctrl.changePassword);
router.get('/by-code/:code', authenticate, ctrl.getByChatCode);

export default router;