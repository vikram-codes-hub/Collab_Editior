import { Server, Socket } from 'socket.io'
import { registerCursorHandlers }    from './cursor'
import { registerAwarenessHandlers } from './awareness'
import { registerTerminalHandlers }  from './terminal'
import { registerWebRTCHandlers }    from './webrtc'

/* ============================================================
   Socket.io — main handler registry
   Called once in src/index.ts with the io instance
   Registers all event handlers for every connection
   ============================================================ */

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // ── Register all handler groups ──────────────────────
    registerCursorHandlers(io, socket)
    registerAwarenessHandlers(io, socket)
    registerTerminalHandlers(io, socket)
    registerWebRTCHandlers(io, socket)

    // ── Connection info ──────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} — ${reason}`)
    })

    socket.on('error', (err) => {
      console.error(`❌ Socket error on ${socket.id}:`, err)
    })
  })

  console.log('✅ Socket.io handlers registered')
}