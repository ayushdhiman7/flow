import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { env, connectDB, connectRedis, disconnectDB, disconnectRedis, closeQueues, isTest } from './config/index.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authenticate, optionalAuth } from './middleware/auth.js';
import { auditLog } from './middleware/audit.js';

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

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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
  await connectDB();
  await connectRedis();

  server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`API docs: http://localhost:${env.PORT}/api-docs`);
  });

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