import { Server, Socket } from 'socket.io'
import { publish, subscribe } from '../services/redis'

/* ============================================================
   Cursor + Room handlers
   Events:
     CLIENT → SERVER: room:join, room:leave, cursor:move
     SERVER → CLIENT: cursor:update, user:joined, user:left,
                      room:users
   ============================================================ */

// Track users per room in memory
// roomId → Map of socketId → { userId, username, color }
const roomUsers = new Map<string, Map<string, {
  userId:   string
  username: string
  color:    string
}>>()

// Presence colors — assigned per user slot in room
const COLORS = [
  '#a78bfa', '#fb923c', '#34d399',
  '#f472b6', '#fbbf24', '#60a5fa',
]

const getColor = (roomId: string): string => {
  const count = roomUsers.get(roomId)?.size ?? 0
  return COLORS[count % COLORS.length]
}

export const registerCursorHandlers = (io: Server, socket: Socket) => {

  // ── room:join ───────────────────────────────────────────
  socket.on('room:join', async (data: {
    roomId:   string
    userId:   string
    username: string
  }) => {
    const { roomId, userId, username } = data

    // Init room map if needed
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map())
    }

    const color = getColor(roomId)

    // Add user to room
    roomUsers.get(roomId)!.set(socket.id, {
      userId,
      username,
      color,
    })

    // Join Socket.io room
    socket.join(roomId)

    // Store roomId on socket for disconnect cleanup
    socket.data.roomId   = roomId
    socket.data.userId   = userId
    socket.data.username = username

    // Tell everyone else this user joined
    socket.to(roomId).emit('user:joined', {
      socketId: socket.id,
      userId,
      username,
      color,
    })

    // Send current room users to the joining user
    const users = Array.from(roomUsers.get(roomId)!.entries()).map(
      ([sid, u]) => ({ socketId: sid, ...u })
    )
    socket.emit('room:users', { users })

    // Persist presence to Redis with 1hr TTL
    await publish(`room:${roomId}:join`, {
      socketId: socket.id,
      userId,
      username,
      color,
    })

    console.log(`👤 ${username} joined room: ${roomId}`)
  })

  // ── room:leave ──────────────────────────────────────────
  socket.on('room:leave', async (data: { roomId: string }) => {
    await handleLeave(io, socket, data.roomId)
  })

  // ── cursor:move ─────────────────────────────────────────
  // Broadcast cursor position to everyone else in room
  socket.on('cursor:move', (data: {
    roomId:   string
    userId:   string
    position: {
      lineNumber: number
      column:     number
    }
  }) => {
    const { roomId, userId, position } = data
    const user = roomUsers.get(roomId)?.get(socket.id)

    // Forward to everyone else in room
    socket.to(roomId).emit('cursor:update', {
      socketId: socket.id,
      userId,
      username: user?.username ?? 'Unknown',
      color:    user?.color    ?? '#ffffff',
      position,
    })
  })

  // ── disconnect ──────────────────────────────────────────
  socket.on('disconnect', async () => {
    const roomId = socket.data.roomId
    if (roomId) {
      await handleLeave(io, socket, roomId)
    }
  })
}

// handle user leaving a room
const handleLeave = async (io: Server, socket: Socket, roomId: string) => {
  const room = roomUsers.get(roomId)
  if (!room) return

  const user = room.get(socket.id)
  room.delete(socket.id)

  // Clean up empty rooms
  if (room.size === 0) {
    roomUsers.delete(roomId)
  }

  socket.leave(roomId)

  // Tell others this user left
  io.to(roomId).emit('user:left', {
    socketId: socket.id,
    userId:   user?.userId,
    username: user?.username,
  })

  await publish(`room:${roomId}:leave`, {
    socketId: socket.id,
    userId:   user?.userId,
  })

  console.log(`👋 ${user?.username ?? socket.id} left room: ${roomId}`)
}