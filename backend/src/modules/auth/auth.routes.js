import { Router } from 'express';
import * as ctrl from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from './auth.validation.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & user profile
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: John Doe }
 *               email: { type: string, example: john@example.com }
 *               password: { type: string, minLength: 8, example: Password123! }
 *     responses:
 *       201: { description: User registered }
 *       409: { description: Duplicate email }
 */
router.post('/register', validate(registerSchema), ctrl.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login success }
 *       401: { description: Invalid credentials }
 */
router.post('/login', validate(loginSchema), ctrl.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Token refreshed }
 */
router.post('/refresh', ctrl.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authenticate, ctrl.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 */
router.get('/me', authenticate, ctrl.me);

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: Update profile
 *     tags: [Auth]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Profile updated }
 */
router.put('/me', authenticate, validate(updateProfileSchema), ctrl.updateProfile);

/**
 * @swagger
 * /api/auth/me/avatar:
 *   post:
 *     summary: Upload avatar
 *     tags: [Auth]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200: { description: Avatar uploaded }
 */
router.post('/me/avatar', authenticate, upload.single('avatar'), ctrl.uploadAvatar);

/**
 * @swagger
 * /api/auth/me/password:
 *   put:
 *     summary: Change password
 *     tags: [Auth]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
router.put('/me/password', authenticate, validate(changePasswordSchema), ctrl.changePassword);

/**
 * @swagger
 * /api/auth/by-code/{code}:
 *   get:
 *     summary: Get user by chat code
 *     tags: [Auth]
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - { name: code, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: User found }
 */
router.get('/by-code/:code', authenticate, ctrl.getByChatCode);

export default router;