import { Router, Response } from 'express';
import Joi from 'joi';
import { pool } from '../db/postgres';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const createRoomSchema = Joi.object({
  name:     Joi.string().min(2).max(60).required(),
  language: Joi.string().default('javascript'),
});

// GET /api/rooms — list all rooms
router.get('/', authMiddleware, async (_req, res: Response) => {
  const { rows } = await pool.query(
    'SELECT r.*, u.username AS creator FROM rooms r LEFT JOIN users u ON r.created_by = u.id ORDER BY r.created_at DESC'
  );
  res.json(rows);
});

// POST /api/rooms — create a room
router.post('/', authMiddleware, validate(createRoomSchema), async (req: AuthRequest, res: Response) => {
  const { name, language } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO rooms (name, language, created_by) VALUES ($1, $2, $3) RETURNING *',
    [name, language, req.user!.userId]
  );
  res.status(201).json(rows[0]);
});

// GET /api/rooms/:id — single room
router.get('/:id', authMiddleware, async (req, res: Response) => {
  const { rows } = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Room not found' });
  res.json(rows[0]);
});

// DELETE /api/rooms/:id — delete room
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Room not found' });
  if (rows[0].created_by !== req.user!.userId)
    return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

export default router;
