import { pool } from '../db/postgres'
import { AppError } from '../middleware/error'

/*Snapshot Model — all DB queries for snapshots table
   Snapshots store Yjs document state as binary (BYTEA)
*/

export interface Snapshot {
  id:         string
  room_id:    string
  data:       Buffer
  updated_at: Date
}

/*Save or update snapshot*/
// Uses upsert — each room has exactly ONE latest snapshot
export const saveSnapshot = async (
  roomId:  string,
  content: Buffer
): Promise<void> => {
  await pool.query(
    `INSERT INTO snapshots (room_id, data)
     VALUES ($1, $2)
     ON CONFLICT (room_id)
     DO UPDATE SET
       data       = EXCLUDED.data,
       updated_at = NOW()`,
    [roomId, content]
  )
}

/*Get latest snapshot for a room*/
export const getSnapshot = async (
  roomId: string
): Promise<Snapshot | null> => {
  const { rows } = await pool.query(
    `SELECT * FROM snapshots
     WHERE room_id = $1`,
    [roomId]
  )
  return rows[0] ?? null
}

/*Delete snapshot for a room*/
export const deleteSnapshot = async (
  roomId: string
): Promise<void> => {
  await pool.query(
    'DELETE FROM snapshots WHERE room_id = $1',
    [roomId]
  )
}

/*Check if snapshot exists*/
export const snapshotExists = async (
  roomId: string
): Promise<boolean> => {
  const { rows } = await pool.query(
    'SELECT 1 FROM snapshots WHERE room_id = $1',
    [roomId]
  )
  return rows.length > 0
}

/*Get snapshot size in bytes*/
// Useful for monitoring how large documents are getting
export const getSnapshotSize = async (
  roomId: string
): Promise<number> => {
  const { rows } = await pool.query(
    `SELECT octet_length(data) AS size
     FROM snapshots
     WHERE room_id = $1`,
    [roomId]
  )
  return rows[0]?.size ?? 0
}