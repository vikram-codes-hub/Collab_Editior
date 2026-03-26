import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectDB } from './db/postgres';
import { redis } from './services/redis';
import { startYjsServer } from './services/yjsServer';

import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import userRoutes from './routes/users';

import { registerCursorHandlers } from './sockets/cursor';
import { registerAwarenessHandlers } from './sockets/awareness';
import { errorHandler } from './middleware/error';

dotenv.config();

const app  = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
});

// ── Middleware ──────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ──────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Socket.io ───────────────────────────────
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  registerCursorHandlers(io, socket);
  registerAwarenessHandlers(io, socket);
  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});

// ── Error handler ───────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────
const PORT     = parseInt(process.env.PORT || '4000', 10);
const YJS_PORT = parseInt(process.env.YJS_PORT || '1234', 10);

const start = async () => {
  await connectDB();
  startYjsServer(YJS_PORT);
  server.listen(PORT, () => {
    console.log(`✅ HTTP + Socket.io server running on http://localhost:${PORT}`);
  });
};

start();
