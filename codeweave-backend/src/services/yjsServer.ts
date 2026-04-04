import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'
import * as Y from 'yjs'
import { saveSnapshot, loadSnapshot } from './snapshotService'
import { SNAPSHOT_INTERVAL_MS } from '../constants'

// ── In-memory doc store ────────────────────────────────────
// roomId → Y.Doc
const docs = new Map<string, Y.Doc>()

// ── Get or create a Y.Doc for a room ──────────────────────
export const getDoc = async (roomId: string): Promise<Y.Doc> => {
  if (docs.has(roomId)) return docs.get(roomId)!

  const doc = new Y.Doc()
  docs.set(roomId, doc)

  // Load persisted snapshot from PostgreSQL
  const found = await loadSnapshot(roomId, doc)
  if (found) {
    console.log(`📄 Loaded snapshot for room: ${roomId}`)
  } else {
    console.log(`🆕 New room, no snapshot: ${roomId}`)
  }

  // Auto-save snapshot every 30s
  const interval = setInterval(async () => {
    try {
      await saveSnapshot(roomId, doc)
      console.log(`💾 Auto-saved snapshot for room: ${roomId}`)
    } catch (err) {
      console.error(`❌ Snapshot save failed for room ${roomId}:`, err)
    }
  }, SNAPSHOT_INTERVAL_MS)

  // Clean up when doc is destroyed
  doc.on('destroy', () => {
    clearInterval(interval)
    docs.delete(roomId)
  })

  return doc
}

// ── Start the Yjs WebSocket server ─────────────────────────
export const startYjsServer = (port: number) => {
  const wss = new WebSocketServer({ port })

  wss.on('connection', async (ws, req) => {
    // URL format: ws://localhost:1234/room-id
    const roomId = req.url?.slice(1) ?? 'default'

    const doc = await getDoc(roomId)

    // y-websocket handles all the CRDT sync
    setupWSConnection(ws, req, { doc })

    ws.on('close', async () => {
      // Save snapshot when last user disconnects
      try {
        await saveSnapshot(roomId, doc)
        console.log(`💾 Saved snapshot on disconnect for room: ${roomId}`)
      } catch (err) {
        console.error(`❌ Snapshot save on disconnect failed:`, err)
      }
    })
  })

  console.log(`✅ y-websocket server running on ws://localhost:${port}`)
}