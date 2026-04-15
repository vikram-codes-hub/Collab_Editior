import { pool } from '../db/postgres'

/* ============================================================
   Note Model — private per-user-per-room notepad
   Each user has their own isolated note in a room.
   No other user can see or know what was written.
   ============================================================ */

export interface Note {
  room_id:    string
  user_id:    string
  content:    string
  updated_at: Date
}

/* Get private note for a specific user in a room */
export const getNoteByUserId = async (
  roomId: string,
  userId: string
): Promise<Note | null> => {
  const { rows } = await pool.query(
    `SELECT * FROM notes WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  )
  return rows[0] ?? null
}

/* Save or update a user's private note */
export const saveNote = async (
  roomId:  string,
  userId:  string,
  content: string
): Promise<Note> => {
  const { rows } = await pool.query(
    `INSERT INTO notes (room_id, user_id, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (room_id, user_id)
     DO UPDATE SET
       content    = EXCLUDED.content,
       updated_at = NOW()
     RETURNING *`,
    [roomId, userId, content]
  )
  return rows[0]
}

/* Clear a user's private note */
export const clearNote = async (
  roomId: string,
  userId: string
): Promise<void> => {
  await pool.query(
    `UPDATE notes SET content = '', updated_at = NOW()
     WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  )
}

/* Delete a user's note row entirely */
export const deleteNote = async (
  roomId: string,
  userId: string
): Promise<void> => {
  await pool.query(
    `DELETE FROM notes WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  )
}