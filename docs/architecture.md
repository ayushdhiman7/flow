# Flow - Architecture Diagram

## Overview
Mini SaaS inspired by Notion/Trello/Slack built with Express + MongoDB + Redis + Socket.io and React + Vite.

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Frontend (React 19 + Vite)"]
        UI["React Components<br/>Board / Notes / Chat"]
        Store["Redux Toolkit<br/>Zustand stores"]
        PWA["PWA Service Worker<br/>Workbox"]
        RHF["React Hook Form + Zod"]
        DnD["dnd-kit Drag&Drop"]
        Theme["ThemeContext<br/>Dark Mode"]
    end

    subgraph Server["Backend (Express + Node 20)"]
        API["REST API (52 endpoints)<br/>Swagger /api-docs"]
        AuthMW["Auth / RBAC / Validate<br/>Helmet + RateLimit"]
        CacheMW["Redis Cache<br/>flow:workspaces / board:full"]
        AuditMW["Audit Log<br/>morgan + winston"]
        Upload["Multer File Upload"]
    end

    subgraph Data["Data Layer"]
        Mongo[(MongoDB 7<br/>Mongoose)]
        Redis[(Redis 7<br/>BullMQ)]
        Queue["BullMQ Queues<br/>email / notifications"]
    end

    subgraph Realtime["Realtime"]
        Socket["Socket.io<br/>rooms workspace/board/channel"]
        Presence["Presence / Notifications"]
    end

    UI --> API
    Store --> API
    RHF --> API
    DnD --> API
    API --> AuthMW --> CacheMW --> AuditMW
    AuthMW --> Mongo
    CacheMW --> Redis
    AuditMW --> Mongo
    API --> Queue --> Redis
    Queue --> Socket
    Socket --> Store
    PWA -.-> API

    style Client fill:#e0f2fe,stroke:#0284c7
    style Server fill:#fef3c7,stroke:#d97706
    style Data fill:#dcfce7,stroke:#16a34a
    style Realtime fill:#f3e8ff,stroke:#9333ea
```

## Request Flow

```mermaid
sequenceDiagram
    participant U as Browser
    participant PWA as ServiceWorker
    participant API as Express
    participant Cache as Redis Cache
    participant DB as MongoDB
    participant Q as BullMQ
    participant S as Socket.io

    U->>PWA: fetch /api/workspaces
    PWA->>API: GET /api/workspaces (NetworkFirst)
    API->>Cache: getCache flow:workspaces:{userId}
    alt cache hit
        Cache-->>API: cached workspaces
    else cache miss
        API->>DB: Workspace.find({members.user})
        DB-->>API: workspaces
        API->>Cache: setCache 300s
    end
    API-->>U: 200 workspaces
    API->>Q: addNotificationJob (async)
    Q-->>S: emitToUser / emitToBoard
    S-->>U: message:new / card:moved
```

## Backend Layers

```mermaid
graph LR
    Routes["Routes<br/>auth / workspaces / boards<br/>lists / cards / chat / notes"]
    Validation["Zod Validation<br/>validate middleware"]
    Auth["authenticate<br/>JWT cookie + Bearer"]
    RBAC["authorizeWorkspace<br/>owner>admin>member"]
    Service["Services<br/>workspace.service<br/>board.service w/ Transaction<br/>card.service w/ $text search"]
    Cache["Redis Cache<br/>SCAN delCache"]
    Aggregation["Mongo Aggregations<br/>getBoardFull $lookup + $project<br/>getBoardStats $group $cond"]
    Transaction["Transactions<br/>createBoard<br/>moveCard<br/>reorderLists"]
    SocketLayer["Socket + Audit<br/>auditLog + winston/morgan"]

    Routes --> Validation --> Auth --> RBAC --> Service
    Service --> Cache
    Service --> Aggregation
    Service --> Transaction
    Service --> SocketLayer
```

## Deployment (Docker)

```mermaid
graph TB
    Compose["docker-compose.yml"]
    MongoC["flow-mongo:7<br/>27017 healthcheck mongosh"]
    RedisC["flow-redis:7-alpine<br/>6379 redis-cli ping"]
    APIC["flow-api:3000<br/>node src/app.js<br/>HEALTHCHECK wget /health"]
    WebC["flow-web:80<br/>nginx serve dist<br/>HEALTHCHECK curl /"]

    Compose --> MongoC
    Compose --> RedisC
    Compose --> APIC
    APIC --> MongoC
    APIC --> RedisC
    WebC --> APIC
```

## Security & Logging

- Helmet, CORS (origin: env.CORS_ORIGIN), rateLimit 100/90s, strictQuery, bcrypt 12, httpOnly secure cookies, Zod validation, RBAC hierarchy, sanitizeBody for audit.
- Logging: morgan combined → winston (json + colorize, file logs/error.log in prod), auditLog middleware to AuditLog collection.

## References

- Source: `backend/src/app.js:26` helmet/cors, `backend/src/middleware/rbac.js:7`, `backend/src/config/redis.js:26`, `backend/src/config/logger.js:1`, `docs/openapi.yaml:1`
- Live docs: `http://localhost:3000/api-docs` (Swagger), `http://localhost:3000/health`
