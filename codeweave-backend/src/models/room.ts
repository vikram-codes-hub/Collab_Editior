import { pool } from "../db/postgres";
import { AppError } from "../middleware/error";

/*Room Model — all DB queries for rooms table*/

export interface Room {
  id: string;
  name: string;
  language: string;
  created_by: string;
  created_at: Date;
  member_count?: number;
  online_count?: number;
  creator?: string;
}

export interface CreateRoomInput {
  name: string;
  language: string;
  createdBy: string;
}

/*Create room + auto join creator*/
export const createRoom = async (input: CreateRoomInput): Promise<Room> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO rooms (name, language, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.name, input.language, input.createdBy],
    );

    const room = rows[0];

    // Auto join creator as first member
    await client.query(
      `INSERT INTO room_members (room_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [room.id, input.createdBy],
    );

    await client.query("COMMIT");
    return { ...room, member_count: 1 };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/*Get all rooms with member count*/
export const getAllRooms = async (): Promise<Room[]> => {
  const { rows } = await pool.query(`
    SELECT
      r.*,
      u.username                        AS creator,
      COUNT(DISTINCT rm.user_id)::int   AS member_count
    FROM rooms r
    LEFT JOIN users u
      ON r.created_by = u.id
    LEFT JOIN room_members rm
      ON r.id = rm.room_id
    GROUP BY r.id, u.username
    ORDER BY r.created_at DESC
  `);
  return rows;
};

/*Get single room by ID*/
export const getRoomById = async (id: string): Promise<Room | null> => {
  const { rows } = await pool.query(
    `
    SELECT
      r.*,
      u.username AS creator
    FROM rooms r
    LEFT JOIN users u
      ON r.created_by = u.id
    WHERE r.id = $1
  `,
    [id],
  );

  return rows[0] ?? null;
};

/*Get rooms a user is member of*/
export const getUserRooms = async (userId: string): Promise<Room[]> => {
  const { rows } = await pool.query(
    `
    SELECT
      r.*,
      u.username                        AS creator,
      COUNT(DISTINCT rm2.user_id)::int  AS member_count
    FROM rooms r
    JOIN room_members rm
      ON r.id = rm.room_id
      AND rm.user_id = $1
    LEFT JOIN users u
      ON r.created_by = u.id
    LEFT JOIN room_members rm2
      ON r.id = rm2.room_id
    GROUP BY r.id, u.username
    ORDER BY r.created_at DESC
  `,
    [userId],
  );

  return rows;
};

/*Get room members*/
export const getRoomMembers = async (roomId: string) => {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.username,
      u.email,
      rm.joined_at
    FROM room_members rm
    JOIN users u
      ON rm.user_id = u.id
    WHERE rm.room_id = $1
    ORDER BY rm.joined_at ASC
  `,
    [roomId],
  );

  return rows;
};

/*Join room*/
export const joinRoom = async (
  roomId: string,
  userId: string,
): Promise<void> => {
  const room = await getRoomById(roomId);
  if (!room) throw new AppError("Room not found", 404);

  await pool.query(
    `INSERT INTO room_members (room_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [roomId, userId],
  );
};

/*Leave room*/
export const leaveRoom = async (
  roomId: string,
  userId: string,
): Promise<void> => {
  await pool.query(
    `DELETE FROM room_members
     WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId],
  );
};

/*Update room*/
export const updateRoom = async (
  id: string,
  userId: string,
  input: Partial<{ name: string; language: string }>,
): Promise<Room> => {
  // Only creator can update
  const room = await getRoomById(id);
  if (!room) throw new AppError("Room not found", 404);
  if (room.created_by !== userId) {
    throw new AppError("Only the creator can update this room", 403);
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (input.name) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.language) {
    fields.push(`language = $${idx++}`);
    values.push(input.language);
  }

  if (fields.length === 0) {
    throw new AppError("No fields to update", 400);
  }

  values.push(id);

  const { rows } = await pool.query(
    `UPDATE rooms
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    values,
  );

  return rows[0];
};

/*Delete room*/
export const deleteRoom = async (id: string, userId: string): Promise<void> => {
  const room = await getRoomById(id);
  if (!room) throw new AppError("Room not found", 404);
  if (room.created_by !== userId) {
    throw new AppError("Only the creator can delete this room", 403);
  }

  await pool.query("DELETE FROM rooms WHERE id = $1", [id]);
};

/*Check if user is member of room*/
export const isRoomMember = async (
  roomId: string,
  userId: string,
): Promise<boolean> => {
  const { rows } = await pool.query(
    `SELECT 1 FROM room_members
     WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId],
  );
  return rows.length > 0;
};
