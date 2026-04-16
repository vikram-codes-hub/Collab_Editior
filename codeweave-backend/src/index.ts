import express        from 'express'
import http           from 'http'
import { Server }     from 'socket.io'
import cors           from 'cors'
import helmet         from 'helmet'
import morgan         from 'morgan'
import dotenv         from 'dotenv'

import { connectDB }               from './db/postgres'
import { redis }                   from './services/redis'
import { startYjsServer }          from './services/yjsServer'
import { registerSocketHandlers }  from './sockets/index'
import { errorHandler }            from './middleware/error'

import authRoutes      from './routes/auth'
import roomRoutes      from './routes/rooms'
import userRoutes      from './routes/users'
import noteRoutes      from './routes/notes'
import executionRoutes from './routes/execution'

dotenv.config()

const app    = express()
const server = http.createServer(app)

/* ✅ Allowed Origins */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5174'
]

/* ── Socket.io ────────────────────────────────────────────── */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
})

/* ── Express middleware ───────────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: false,
}))

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

/* ── Health check ─────────────────────────────────────────── */
app.get('/health', (_req, res) => {
  res.json({
    status:   'ok',
    service:  'depot-backend',
    uptime:   process.uptime(),
    memory:   process.memoryUsage(),
    redis:    redis.status,
  })
})

/* ── API Routes ───────────────────────────────────────────── */
app.use('/api/auth',      authRoutes)
app.use('/api/rooms',     roomRoutes)
app.use('/api/users',     userRoutes)
app.use('/api/notes',     noteRoutes)
app.use('/api/execution', executionRoutes)

/* ── 404 handler ──────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

/* ── Global error handler ─────────────────────────────────── */
app.use(errorHandler)

/* ── Socket.io handlers ───────────────────────────────────── */
registerSocketHandlers(io)

/* ── Start ────────────────────────────────────────────────── */
const PORT     = parseInt(process.env.PORT     || '4000', 10)
const YJS_PORT = parseInt(process.env.YJS_PORT || '1234', 10)

const start = async () => {
  try {
    await connectDB()
    console.log('✅ PostgreSQL connected')

    await redis.ping()
    console.log('✅ Redis connected')

    startYjsServer(YJS_PORT)
    console.log(`✅ Yjs server on ws://localhost:${YJS_PORT}`)

    server.listen(PORT, () => {
      console.log('')
      console.log('🚀 Depot backend running')
      console.log(`   HTTP  → http://localhost:${PORT}`)
      console.log(`   WS    → ws://localhost:${PORT}`)
      console.log(`   Yjs   → ws://localhost:${YJS_PORT}`)
      console.log(`   Env   → ${process.env.NODE_ENV}`)
      console.log('')
    })

  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

/* ── Graceful shutdown ────────────────────────────────────── */
const shutdown = async (signal: string) => {
  console.log(`\n⚠️  ${signal} received — shutting down gracefully`)

  server.close(() => {
    console.log('✅ HTTP server closed')
  })

  await redis.quit()
  console.log('✅ Redis disconnected')

  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err)
})
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err)
  process.exit(1)
})

start()

export { io }