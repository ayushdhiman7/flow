# Flow - Mini SaaS Application

A lightweight Notion/Trello/Slack-inspired SaaS built with modern tech stack.

## Tech Stack

**Backend**
- Express.js + TypeScript
- MongoDB + Mongoose
- Redis + BullMQ for job queues
- Socket.io for real-time
- JWT Auth (access + refresh tokens)
- RBAC (Owner/Admin/Member)

**Frontend**
- React 18 + Vite + TypeScript
- Zustand for state management
- React Hook Form + Zod
- dnd-kit for drag & drop
- Tailwind CSS
- Socket.io client

**DevOps**
- Docker + Docker Compose
- GitHub Actions CI/CD
- Swagger/OpenAPI docs

## Features

- **Authentication**: Register, login, JWT with refresh tokens, logout
- **Workspaces**: Create, invite members, role management (owner/admin/member)
- **Boards**: Kanban boards with customizable backgrounds
- **Lists**: Create, reorder, archive lists
- **Cards**: Create, move between lists, assign members, due dates, labels, comments
- **Real-time**: Live updates via Socket.io (card moves, new messages, notifications)
- **Chat**: Channels and DMs with real-time messaging
- **Dark mode**: Persisted theme preference
- **Optimistic UI**: Instant feedback with background sync

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

# Start all services
docker-compose up -d

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/api-docs
```

### Local Development

```bash
# Terminal 1 - Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Terminal 3 - MongoDB & Redis (or use Docker)
docker run -d -p 27017:27017 --name mongo mongo:7
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

## Environment Variables

### Backend (.env)
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

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `POST /api/workspaces/:id/members` - Invite member
- `PUT /api/workspaces/:id/members/:userId` - Update member role
- `DELETE /api/workspaces/:id/members/:userId` - Remove member

### Boards
- `GET /api/workspaces/:workspaceId/boards` - List boards
- `POST /api/workspaces/:workspaceId/boards` - Create board
- `GET /api/boards/:id` - Get board
- `GET /api/boards/:id/full` - Get board with lists & cards
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Lists
- `GET /api/boards/:boardId/lists` - List lists
- `POST /api/boards/:boardId/lists` - Create list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list
- `POST /api/boards/:boardId/lists/reorder` - Reorder lists

### Cards
- `GET /api/lists/:listId/cards` - List cards (paginated)
- `POST /api/lists/:listId/cards` - Create card
- `GET /api/cards/:id` - Get card
- `PUT /api/cards/:id` - Update card
- `PATCH /api/cards/:id/move` - Move card
- `DELETE /api/cards/:id` - Delete card
- `POST /api/cards/:id/assignees` - Add assignees
- `DELETE /api/cards/:id/assignees/:assigneeId` - Remove assignee

### Chat
- `GET /api/workspaces/:workspaceId/channels` - List channels
- `POST /api/workspaces/:workspaceId/channels` - Create channel
- `POST /api/workspaces/:workspaceId/channels/dm` - Create DM
- `GET /api/channels/:id/messages` - Get messages (paginated)
- `POST /api/channels/:id/messages` - Send message

## Real-time Events

### Socket.io Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-access-token' }
});
```

### Client → Server
- `join:workspace` (workspaceId)
- `join:board` (boardId)
- `join:channel` (channelId)
- `leave:workspace` (workspaceId)
- `leave:board` (boardId)
- `leave:channel` (channelId)
- `presence:update` ({ status: 'online' | 'away' | 'busy' })

### Server → Client
- `card:created` ({ card })
- `card:moved` ({ card, fromList })
- `card:updated` ({ card })
- `card:deleted` ({ cardId })
- `card:assigned` ({ card, assignees })
- `message:new` ({ message })
- `notification:new` ({ notification })
- `presence:update` ({ userId, status })

## Project Structure

```
flow/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, Queue config
│   │   ├── middleware/      # Auth, RBAC, Audit, Error handling
│   │   ├── modules/
│   │   │   ├── auth/        # Auth module
│   │   │   ├── users/       # User management
│   │   │   ├── workspaces/  # Workspace CRUD + members
│   │   │   ├── boards/      # Board CRUD
│   │   │   ├── lists/       # List CRUD + reorder
│   │   │   ├── cards/       # Card CRUD + move + assignees
│   │   │   └── chat/        # Channels + messages
│   │   ├── socket/          # Socket.io handlers
│   │   ├── jobs/            # BullMQ processors
│   │   ├── utils/           # JWT, constants, helpers
│   │   └── app.js           # Express app setup
│   └── tests/               # API tests
├── frontend/
│   ├── src/
│   │   ├── store/           # Zustand stores
│   │   ├── api/             # Axios + endpoints
│   │   ├── components/      # Shared UI components
│   │   ├── features/        # Feature components
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Helpers
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Development

### Running Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Linting
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

### Code Formatting
```bash
# Backend
cd backend && npm run format

# Frontend
cd frontend && npm run format
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   MongoDB   │
│  (React)    │     │  (Express)  │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │    Redis    │
                    │  (Cache +   │
                    │   Queue)    │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  Socket.io  │
                    │  (Real-time)│
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