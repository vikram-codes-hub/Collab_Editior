import { pool } from '../db/postgres'
import * as Y from 'yjs'

// Save Yjs doc state to PostgreSQL
export const saveSnapshot = async (
  roomId: string,
  doc: Y.Doc
): Promise<void> => {
  const content = Buffer.from(Y.encodeStateAsUpdate(doc))

  await pool.query(
    `INSERT INTO snapshots (room_id, content)
     VALUES ($1, $2)
     ON CONFLICT (room_id)
     DO UPDATE SET content = $2, saved_at = NOW()`,
    [roomId, content]
  )
}

// Load snapshot from PostgreSQL and apply to doc
export const loadSnapshot = async (
  roomId: string,
  doc: Y.Doc
): Promise<boolean> => {
  const { rows } = await pool.query(
    `SELECT content FROM snapshots
     WHERE room_id = $1
     ORDER BY saved_at DESC
     LIMIT 1`,
    [roomId]
  )

  if (!rows[0]) return false

  Y.applyUpdate(doc, rows[0].content)
  return true
}