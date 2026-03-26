import { Router, Response } from 'express';
import { pool } from '../db/postgres';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    'SELECT id, email, username, created_at FROM users WHERE id = $1',
    [req.user!.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

export default router;
