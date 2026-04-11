import { pool } from '../db/postgres'
import { AppError } from '../middleware/error'

/* ============================================================
   Note Model — all DB queries for notes table
   Notes are the collaborative notepad per room
   Stored as markdown text, synced via Yjs in real time
   DB copy is a backup/restore point like snapshots
   ============================================================ */

export interface Note {
  id:         string
  room_id:    string
  content:    string
  updated_by: string
  updated_at: Date
  username?:  string  // joined from users table
}

/* ── First add notes table to init.sql ────────────────────── */
// Run this if you haven't already:
//
// CREATE TABLE IF NOT EXISTS notes (
//   id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   room_id    UUID UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
//   content    TEXT NOT NULL DEFAULT '',
//   updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE INDEX IF NOT EXISTS idx_notes_room
//   ON notes(room_id);

/*Get note for a room*/
export const getNoteByRoomId = async (
  roomId: string
): Promise<Note | null> => {
  const { rows } = await pool.query(`
    SELECT
      n.*,
      u.username
    FROM notes n
    LEFT JOIN users u
      ON n.updated_by = u.id
    WHERE n.room_id = $1
  `, [roomId])

  return rows[0] ?? null
}

/*Save or update note*/
// Each room has exactly ONE note — upsert like snapshots
export const saveNote = async (
  roomId:    string,
  content:   string,
  updatedBy: string
): Promise<Note> => {
  const { rows } = await pool.query(`
    INSERT INTO notes (room_id, content, updated_by)
    VALUES ($1, $2, $3)
    ON CONFLICT (room_id)
    DO UPDATE SET
      content    = EXCLUDED.content,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *
  `, [roomId, content, updatedBy])

  return rows[0]
}

/*Clear note content*/
export const clearNote = async (
  roomId:    string,
  updatedBy: string
): Promise<void> => {
  await pool.query(`
    UPDATE notes
    SET
      content    = '',
      updated_by = $2,
      updated_at = NOW()
    WHERE room_id = $1
  `, [roomId, updatedBy])
}

/*Delete note*/
export const deleteNote = async (
  roomId: string
): Promise<void> => {
  await pool.query(
    'DELETE FROM notes WHERE room_id = $1',
    [roomId]
  )
}

/*Get note history*/
// Who last updated + when
export const getNoteMetadata = async (roomId: string) => {
  const { rows } = await pool.query(`
    SELECT
      n.room_id,
      n.updated_at,
      n.updated_by,
      u.username
    FROM notes n
    LEFT JOIN users u
      ON n.updated_by = u.id
    WHERE n.room_id = $1
  `, [roomId])

  return rows[0] ?? null
}