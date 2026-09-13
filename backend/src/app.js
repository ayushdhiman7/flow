import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import path from 'path';
import { fileURLToPath } from 'url';
import { env, connectDB, connectRedis, disconnectDB, disconnectRedis, closeQueues, isTest } from './config/index.js';
import { logger, stream } from './config/logger.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authenticate, optionalAuth } from './middleware/auth.js';
import { auditLog } from './middleware/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './modules/auth/auth.routes.js';
import workspaceRoutes from './modules/workspaces/workspace.routes.js';
import boardRoutes from './modules/boards/board.routes.js';
import listRoutes from './modules/lists/list.routes.js';
import cardRoutes from './modules/cards/card.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import noteRoutes from './modules/notes/note.routes.js';

import { initSocket } from './socket/socket.js';
import './jobs/index.js';

const app = express();

// Structured logging - skip health checks to reduce noise
app.use(morgan(isTest ? 'tiny' : 'combined', {
  stream,
  skip: (req) => req.url === '/health' || req.url === '/api-docs',
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// Normalize: trim whitespace AND trailing slashes so
// "https://app.vercel.app/" still matches the browser Origin header.
const stripSlash = (s) => s.replace(/\/+$/, '');
const allowedOrigins = env.CORS_ORIGIN.split(",").map(s => stripSlash(s.trim())).filter(Boolean);
logger.info(`CORS allowed origins: ${allowedOrigins.join(', ') || '(none — set CORS_ORIGIN)'}`);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(stripSlash(origin))) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Required behind Render/proxies: correct client IPs for rate-limit
// and secure cross-site cookies.
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/health',
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Separate stricter limiter for auth brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flow API',
      version: '1.0.0',
      description: 'Mini SaaS API - Notion/Trello/Slack lite',
    },
    servers: [{ url: `http://localhost:${env.PORT}/api`, description: 'Development' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'accessToken' },
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ cookieAuth: [], bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve uploaded avatars statically
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR || './uploads'), {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', auditLog('workspace:access', 'workspace'), workspaceRoutes);
app.use('/api/workspaces/:workspaceId/boards', auditLog('board:access', 'board'), boardRoutes);
app.use('/api/boards/:boardId/lists', auditLog('list:access', 'list'), listRoutes);
app.use('/api/lists/:listId/cards', auditLog('card:access', 'card'), cardRoutes);
app.use('/api/workspaces/:workspaceId/channels', auditLog('channel:access', 'channel'), chatRoutes);
app.use('/api/workspaces/:workspaceId/notes', auditLog('note:access', 'note'), noteRoutes);

app.use(notFound);
app.use(errorHandler);

let server;

export async function startServer() {
  // Bind the port FIRST so Render's health check/port binding passes even
  // while downstream services are still connecting.
  server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
    logger.info(`API docs: http://localhost:${env.PORT}/api-docs`);
  });

  await connectDB(); // hard dependency: crash + restart if Mongo is unreachable
  await connectRedis(); // soft dependency: never throws, app runs degraded

  initSocket(server);
  return server;
}

export async function stopServer() {
  if (server) {
    await closeQueues();
    await disconnectRedis();
    await disconnectDB();
    server.close();
  }
}

if (!isTest) {
  startServer().catch(console.error);
}

export default app;