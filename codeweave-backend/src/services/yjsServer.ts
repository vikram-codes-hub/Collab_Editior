import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'
import * as Y from 'yjs'
import { saveSnapshot, loadSnapshot } from './snapshotService'
import { SNAPSHOT_INTERVAL_MS } from '../constant'

const docs      = new Map<string, Y.Doc>()
const intervals = new Map<string, NodeJS.Timeout>() // ✅ track intervals

export const getDoc = async (roomId: string): Promise<Y.Doc> => {
  if (docs.has(roomId)) return docs.get(roomId)!

  const doc = new Y.Doc()
  docs.set(roomId, doc)

  const found = await loadSnapshot(roomId, doc)
  console.log(found ? `📄 Loaded snapshot for room: ${roomId}` : `🆕 New room: ${roomId}`)

  // ✅ Only start interval if not already running
  if (!intervals.has(roomId)) {
    const interval = setInterval(async () => {
      try {
        await saveSnapshot(roomId, doc)
        console.log(`💾 Auto-saved: ${roomId}`)
      } catch (err) {
        console.error(`❌ Snapshot save failed for ${roomId}:`, err)
      }
    }, SNAPSHOT_INTERVAL_MS)

    intervals.set(roomId, interval)
  }

  doc.on('destroy', () => {
    clearInterval(intervals.get(roomId))
    intervals.delete(roomId)
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