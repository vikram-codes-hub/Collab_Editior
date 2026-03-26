# ⚡ CollabEdit — Real-Time Collaborative Code Editor

> A full-stack collaborative coding environment powered by CRDTs, WebSockets, and the VS Code editor engine.

🔗 **Live Demo:** _Coming soon_

---

## 🧠 What Is This?

CollabEdit lets multiple developers edit the same file simultaneously — changes merge instantly, cursors are visible in real-time, and nothing is ever lost. Think Google Docs, but for code.

Built with **Yjs CRDTs** for conflict-free merging, **Monaco Editor** for a VS Code-grade experience, and **Socket.io** for live presence and cursor tracking.

---

## 🏗️ System Architecture

![System Architecture](./Image_Resources/system_architecture.svg)

---

## 🗺️ How It Works

![How It Works](./Image_Resources/how_it_works.svg)

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + TypeScript | UI framework |
| Monaco Editor | VS Code editor engine (syntax highlighting, autocomplete, themes) |
| Yjs | CRDT library — manages local doc state and conflict-free merging |
| y-websocket | Syncs Yjs documents over WebSockets |
| TailwindCSS | Styling |
| Zustand | Lightweight state management (rooms, user info) |
| React Router | Routing (home, editor, auth pages) |
| Axios | HTTP requests |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | HTTP server + REST API |
| Socket.io | WebSocket server (real-time events, cursor positions, awareness) |
| y-websocket server | Yjs CRDT sync server |
| Redis | Pub/sub for multi-instance broadcasting + presence/online users |
| PostgreSQL | Stores users, rooms, document snapshots |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| Joi | Request validation |

### DevOps
| Tech | Purpose |
|------|---------|
| Docker + Docker Compose | Containerize Node, Redis, Postgres |
| Railway / Render | Free deployment |
| GitHub Actions | CI pipeline (lint, test, build on push) |

---

## 📁 Project Structure

```
collab-editor/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── hooks/
│   │   │   └── useYjs.ts       # ⭐ Heart of the project — CRDT + Monaco binding
│   │   ├── pages/              # Home, Editor, Auth pages
│   │   ├── store/              # Zustand state
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   └── src/
│       ├── index.ts            # Express + Socket.io bootstrap
│       ├── yjsServer.ts        # Yjs WebSocket CRDT sync server
│       ├── db/
│       │   ├── pool.ts         # Postgres connection pool
│       │   ├── redis.ts        # Redis client
│       │   └── migrations/     # SQL migration files
│       │       ├── 001_users.sql
│       │       ├── 002_rooms.sql
│       │       └── 003_documents.sql
│       ├── models/             # TypeScript types: User, Room, Document
│       ├── controllers/        # auth, rooms, doc (get/save snapshot)
│       ├── routes/             # REST endpoints with Joi validation
│       ├── middleware/         # JWT auth guard + request validator
│       ├── sockets/            # cursor broadcasting + presence events
│       └── utils/              # JWT helpers + structured logger
│
├── docker-compose.yml
└── .env.example
```

---

## 🔌 REST API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Returns JWT |
| POST | `/api/rooms` | ✅ | Create new room |
| GET | `/api/rooms` | ✅ | List user's rooms |
| GET | `/api/rooms/:id` | ✅ | Get room details |
| GET | `/api/doc/:roomId` | ✅ | Get saved snapshot |
| DELETE | `/api/rooms/:id` | ✅ | Delete room |

---

## 📡 Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join-room` | Client → Server | `{ roomId, userId }` |
| `cursor-move` | Client → Server | `{ roomId, position }` |
| `cursor-update` | Server → Client | `{ userId, position, color }` |
| `user-joined` | Server → Client | `{ userId, username }` |
| `user-left` | Server → Client | `{ userId }` |

---

## 🔑 Key Code

```typescript
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'

const wss = new WebSocketServer({ port: 1234 })

wss.on('connection', (ws, req) => {
  // y-websocket handles ALL the CRDT sync logic
  setupWSConnection(ws, req)
})
```

---

## 🚀 Getting Started

### Option A — Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/your-username/collab-editor.git
cd collab-editor

# Copy and fill in your env vars
cp .env.example .env

# Start everything
docker-compose up
```

App will be live at `http://localhost:5173`

### Option B — Local Dev (3 terminals)

```bash
# Terminal 1 — Infrastructure
docker-compose up db redis

# Terminal 2 — Backend
cd server
npm install
npm run migrate   # creates all 3 tables
npm run dev       # starts on :3000 + Yjs on :1234

# Terminal 3 — Frontend
cd client
npm install
npm run dev       # starts on :5173
```

---

## ⚙️ Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/collab_editor

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Yjs WebSocket server
YJS_WS_PORT=1234

# Client (Vite)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:1234
```

---

## 🐳 Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: ./server
    ports:
      - "3000:3000"
      - "1234:1234"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/collab_editor
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: collab_editor
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 🧪 CI/CD

GitHub Actions runs on every push to `main`:

```
lint → type-check → test → build
```

Deploys automatically to Railway/Render on green builds.

---

## 📄 License

MIT