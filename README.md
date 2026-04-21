# ⚡ Depot — Real-Time Collaborative Code Editor

<div align="center">
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-black?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
</div>

> A full-stack collaborative coding environment powered by CRDTs, WebSockets, and the VS Code editor engine.

🔗 **Live Demo:** _Coming soon_

---

## 🧠 What Is This?

Depot lets multiple developers edit the same file simultaneously — changes merge instantly, cursors are visible in real-time, and nothing is ever lost. Think Google Docs, but for code.

Built with **Yjs CRDTs** for conflict-free merging, **Monaco Editor** for a VS Code-grade experience, and **Socket.io** for live presence and cursor tracking.

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    %% Styles
    classDef client fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef server fill:#1E293B,stroke:#A78BFA,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef db fill:#0F172A,stroke:#F472B6,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef component fill:#334155,stroke:#475569,stroke-width:1px,color:#E2E8F0,rx:5,ry:5

    subgraph Clients["💻 Web Clients"]
        direction TB
        subgraph UA ["User A"]
            direction LR
            ReactA([React + Monaco]):::component <--> YjsA[[Yjs Doc]]:::component
        end
        subgraph UB ["User B"]
            direction LR
            ReactB([React + Monaco]):::component <--> YjsB[[Yjs Doc]]:::component
        end
    end

    subgraph Backend["🚀 Backend Infrastructure"]
        direction TB
        WS{"WebSocket Server<br/>(Socket.io / y-websocket)"}:::component
        API["Express API<br/>(Auth, Rooms)"]:::component
        Redis[("Redis<br/>(Pub/Sub)")]:::component
        
        WS <--> Redis
    end

    subgraph Persistence["🗄️ Database"]
        direction TB
        PG[("PostgreSQL<br/>(Snapshots, Users)")]:::component
    end

    %% Flow
    YjsA <==>|CRDT Updates| WS
    YjsB <==>|CRDT Updates| WS
    
    UA -->|REST Requests| API
    UB -->|REST Requests| API
    
    API -->|Read/Write| PG
    WS -.->|Periodic Save| PG

    class Clients client
    class Backend server
    class Persistence db
```

---

## 🗺️ How It Works

```mermaid
sequenceDiagram
    autonumber
    
    actor UA as 🧑‍💻 User A
    participant YjA as 🧠 Yjs (A)
    participant WS as 🌐 WebSocket Server
    participant YjB as 🧠 Yjs (B)
    actor UB as 🧑‍💻 User B

    Note over UA,UB: Users are in the same Collaborative Room

    UA->>YjA: Types `const hello = "world";` in Editor
    activate YjA
    YjA->>YjA: Encode Change (CRDT Uint8Array)
    YjA->>WS: Broadcast Binary Update
    deactivate YjA

    WS->>YjB: Forward Update to peers in room
    
    activate YjB
    YjB->>YjB: Apply Update & Merge (Conflict-free)
    YjB->>UB: Update Editor Screen Magically ✨
    deactivate YjB

    Note left of WS: Server optionally saves a binary<br/>snapshot to the database
```

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
depot/
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


---

## 🚀 Getting Started

### Option A — Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/your-username/depot.git
cd depot

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
DATABASE_URL=postgresql://user:password@localhost:5432/depot

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