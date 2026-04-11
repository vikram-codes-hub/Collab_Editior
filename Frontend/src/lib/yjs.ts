import * as Y              from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { YJS_URL, PRESENCE_COLORS } from './constants'

/* ============================================================
   Yjs — document + provider setup per room
   One Y.Doc per room, one provider per connection
   ============================================================ */

interface YjsRoom {
  doc:      Y.Doc
  provider: WebsocketProvider
  text:     Y.Text
  destroy:  () => void
}

// Cache active rooms
const activeRooms = new Map<string, YjsRoom>()

/* ── Connect to a Yjs room ────────────────────────────────── */
export const connectYjs = (
  roomId:   string,
  userId:   string,
  username: string,
  colorIdx: number = 0
): YjsRoom => {
  // Return existing if already connected
  if (activeRooms.has(roomId)) {
    return activeRooms.get(roomId)!
  }

  // Create new Yjs document
  const doc  = new Y.Doc()
  const text = doc.getText('code')   // shared text for editor

  // Connect to Yjs WebSocket server
  const provider = new WebsocketProvider(
    YJS_URL,
    roomId,
    doc,
    { connect: true }
  )

  // Set local user awareness
  // This is what shows other users your cursor color + name
  provider.awareness.setLocalStateField('user', {
    userId,
    username,
    color: PRESENCE_COLORS[colorIdx % PRESENCE_COLORS.length],
  })

  provider.on('status', (event: { status: string }) => {
    console.log(`📡 Yjs [${roomId}]:`, event.status)
  })

  const room: YjsRoom = {
    doc,
    provider,
    text,
    destroy: () => {
      provider.destroy()
      doc.destroy()
      activeRooms.delete(roomId)
      console.log(`🗑️  Yjs room destroyed: ${roomId}`)
    },
  }

  activeRooms.set(roomId, room)
  return room
}

/* ── Disconnect from a Yjs room ───────────────────────────── */
export const disconnectYjs = (roomId: string): void => {
  const room = activeRooms.get(roomId)
  if (room) room.destroy()
}

/* ── Get active room ──────────────────────────────────────── */
export const getYjsRoom = (roomId: string): YjsRoom | null => {
  return activeRooms.get(roomId) ?? null
}

/* ── Get awareness states (all users in room) ─────────────── */
export const getAwarenessUsers = (roomId: string) => {
  const room = activeRooms.get(roomId)
  if (!room) return []

  const states = Array.from(
    room.provider.awareness.getStates().entries()
  )

  return states
    .map(([clientId, state]) => ({ clientId, ...state.user }))
    .filter(u => u.userId)
}