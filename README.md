# Flow - Mini SaaS Application

A lightweight Notion/Trello/Slack-inspired SaaS built with modern tech stack.

## Tech Stack

**Backend**
- Express.js (ESM) + Mongoose
- MongoDB Atlas + Redis (cache + BullMQ job queues)
- Socket.io for real-time
- JWT Auth (httpOnly cookies: access + refresh tokens)
- RBAC (Owner/Admin/Member, workspace-scoped)
- Zod validation, Winston + Morgan logging, audit logs

**Frontend**
- React 19 + Vite (JSX) + Redux Toolkit
- React Hook Form + Zod on auth forms
- dnd-kit for board drag & drop (optimistic with server reconcile)
- Tailwind CSS 4 + Socket.io client
- Served via nginx in Docker, static hosting ready (Vercel)

**DevOps**
- Docker + Docker Compose (healthchecks, multi-stage)
- `ui/vercel.json` SPA rewrites for React Router
- GitHub Actions CI (lint → test → build)
- Swagger/OpenAPI docs (`/api-docs`, `docs/openapi.yaml`)

## Features

- **Authentication**: Register, login, JWT with refresh tokens, logout, avatar upload, password change
- **Workspaces**: Create, invite codes, join requests, role management (owner/admin/member)
- **Boards**: Kanban boards with members, stats and full-board aggregation
- **Lists**: Create, update, archive, reorder
- **Cards**: Create, drag & drop between lists, assign members, due dates, labels, text search
- **Notes**: Workspace notes with search and pinning
- **Chat**: Channels and DMs (incl. join by code) with real-time messaging
- **Real-time**: Live updates via Socket.io (card moves, messages, notifications, presence)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### With Docker (Recommended)

```bash
# Clone and navigate
cd flow

# Copy environment files
cp backend/.env.example backend/.env

# Start all services (with healthchecks)
docker compose up -d --wait

# Access:
# Web (nginx): http://localhost:5174
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/api-docs
# Health: http://localhost:3000/health
```

### Local Development

```bash
# Terminal 1 - MongoDB & Redis
docker compose up mongo redis -d

# Terminal 2 - Backend
cd backend
cp .env.example .env   # once
npm install
npm run dev            # node --watch

# Terminal 3 - Frontend
cd ui
npm install
npm run dev            # http://localhost:5173
```

## Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/flow
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-super-secret-access-key-at-least-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`ui/.env`)
```env
VITE_API_URL=http://localhost:3000/api
```

## Deployment (Render + Vercel + Atlas)

**Backend → Render** (manual Web Service
with Root Directory `backend`, Build `npm ci`, Start `node src/app.js`):
- `NODE_ENV=production`, `MONGO_URI` (Atlas SRV string), `REDIS_URL` (Upstash),
  `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (32+ chars each),
  `CORS_ORIGIN=https://<your-app>.vercel.app`
- Atlas → Network Access must allow Render (`0.0.0.0/0`; auth still via DB user)
- The API serves `/health` for Render health checks and sets `trust proxy`
  for correct rate-limiting and secure cookies behind the proxy

**Frontend → Vercel**: set Project **Root Directory to `ui`** and
`VITE_API_URL=https://<your-render-api>.onrender.com/api`
(`ui/vercel.json` already handles SPA rewrites for React Router).

**Notes:** Render free tier sleeps when idle (slow first request); uploaded
avatars live on ephemeral disk and are lost on redeploy.

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout
- `GET /me` - Get current user
- `PUT /me` - Update profile
- `POST /me/avatar` - Upload avatar
- `PUT /me/password` - Change password

### Workspaces (`/api/workspaces`)
- `GET /` - List workspaces
- `POST /` - Create workspace
- `POST /join-by-code` - Join via invite code
- `GET /:id` - Get workspace
- `PUT /:id` - Update workspace (owner)
- `DELETE /:id` - Delete workspace (owner)
- `POST /:id/members` - Invite member
- `PUT /:id/members/:userId` - Update member role
- `DELETE /:id/members/:userId` - Remove member
- `GET /:id/requests` + `POST /:id/requests/:requestId/handle` - Join requests

### Boards (`/api/workspaces/:workspaceId/boards`)
- `GET /` - List boards
- `POST /` - Create board (starts with To Do / In Progress / Done)
- `GET /:id` - Get board
- `GET /:id/full` - Board with lists & cards (aggregation)
- `GET /:id/stats` - Board stats
- `PUT /:id` - Update board (admin/owner)
- `DELETE /:id` - Delete board (admin/owner)
- `POST /:id/members` - Add board member (admin/owner)
- `DELETE /:id/members/:userId` - Remove board member (admin/owner)

### Lists (`/api/boards/:boardId/lists`)
- `GET /` - List lists
- `POST /` - Create list
- `GET /:id` - Get list
- `PUT /:id` - Update list (admin/owner)
- `DELETE /:id` - Delete list (admin/owner)
- `POST /reorder` - Reorder lists (admin/owner)

### Cards (`/api/lists/:listId/cards`)
- `GET /` - List cards (paginated, `search` supported)
- `POST /` - Create card
- `GET /:id` - Get card
- `PUT /:id` - Update card (admin/owner)
- `DELETE /:id` - Delete card (admin/owner)
- `PATCH /:id/move` - Move card (`{ listId, position }`)
- `POST /:id/assignees` - Add assignees (admin/owner)
- `DELETE /:id/assignees/:assigneeId` - Remove assignee (admin/owner)

### Chat (`/api/workspaces/:workspaceId/channels`)
- `GET /` - List channels
- `POST /` - Create channel
- `POST /dm` - Create DM
- `POST /dm-by-code` - Create DM by user code
- `GET /:id` - Get channel
- `GET /:id/messages` - Get messages (paginated)
- `POST /:id/messages` - Send message

### Notes (`/api/workspaces/:workspaceId/notes`)
- `GET /` - List notes (`search`, `isPinned` supported)
- `POST /` - Create note
- `GET /:id` - Get note
- `PUT /:id` - Update note
- `DELETE /:id` - Delete note

## Real-time Events

### Socket.io Connection
```javascript
import { io } from 'socket.io-client';
const socket = io('https://<your-render-api>.onrender.com', {
  auth: { token: 'your-access-token' },
  withCredentials: true,
});
```

### Client → Server
- `join:workspace` (workspaceId) / `leave:workspace`
- `join:board` (boardId) / `leave:board`
- `join:channel` (channelId) / `leave:channel`
- `presence:update` ({ status: 'online' | 'away' | 'busy' })

### Server → Client
- `card:created` / `card:moved` ({ card, fromList }) / `card:updated` / `card:deleted` / `card:assigned`
- `message:new` ({ message })
- `notification:new` ({ notification })
- `presence:update` / `user:joined` / `user:left`

## Project Structure

```
flow/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, Queue, Logger, Env
│   │   ├── middleware/      # Auth, RBAC, Audit, Error, Validate, Upload
│   │   ├── modules/
│   │   │   ├── auth/        # Auth + JWT cookies + sessions + avatar
│   │   │   ├── workspaces/  # Workspace CRUD + members + join requests
│   │   │   ├── boards/      # Board CRUD + full aggregation + stats
│   │   │   ├── lists/       # List CRUD + reorder
│   │   │   ├── cards/       # Card CRUD + move + search + assignees
│   │   │   ├── chat/        # Channels + DMs + messages
│   │   │   ├── notes/       # Notes + search
│   │   │   └── audit/       # AuditLog model
│   │   ├── socket/          # Socket.io handlers (rooms)
│   │   ├── jobs/            # BullMQ processors (email, notifications)
│   │   ├── utils/           # JWT, constants, helpers
│   │   └── app.js           # Express app (trust proxy, helmet, swagger)
│   ├── Dockerfile
│   └── tests/               # API tests (auth, workspace)
├── ui/
│   ├── src/
│   │   ├── app/             # Redux store
│   │   ├── api/             # Fetch client (GET/POST/PUT/PATCH/DELETE)
│   │   ├── lib/             # ids, avatar, slug, utils
│   │   ├── components/      # Shared UI primitives
│   │   ├── features/        # Auth, Board (dnd, optimistic), Chat, Notes, ...
│   │   ├── layouts/         # AppLayout + AuthLayout
│   │   ├── routes/          # AppRoutes + guards
│   │   └── test/            # Vitest setup + smoke tests
│   ├── nginx.conf
│   ├── vercel.json          # SPA rewrites
│   └── Dockerfile           # Multi-stage nginx
├── docs/
│   ├── architecture.md
│   ├── er-diagram.md
│   └── openapi.yaml
├── docker-compose.yml       # mongo/redis/api/web with healthchecks
└── .github/workflows/ci.yml # lint → test → build
```

## Development

### Running Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd ui && npm test
```

### Linting
```bash
# Backend
cd backend && npm run lint

# Frontend
cd ui && npm run lint
```

## Architecture

> See `docs/architecture.md` (Mermaid) and `docs/er-diagram.md` for detailed diagrams.
> Swagger: `/api-docs` when the API is running, or `docs/openapi.yaml`.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   MongoDB   │
│ React + Vite│     │  Express    │     │  Atlas      │
│ Redux + dnd │     │  RBAC/Cache │     │ Aggregations│
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │    Redis    │
                    │  Cache +    │
                    │  BullMQ     │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  Socket.io  │
                    │ (Real-time) │
                    └─────────────┘
```

## Commit Convention

```
feat: add new feature
fix: bug fix
chore: maintenance, config changes
test: add/update tests
docs: documentation
refactor: code refactoring
style: formatting, missing semicolons, etc.
```

## License

MIT
