import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { pool } from '../db/postgres';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = Joi.object({
  email:    Joi.string().email().required(),
  username: Joi.string().min(2).max(30).required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, username, hash]
    );
    const token = jwt.sign(
      { userId: rows[0].id, email: rows[0].email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.status(201).json({ token, user: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, rows[0].password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: rows[0].id, email: rows[0].email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  res.json({ token, user: { id: rows[0].id, email: rows[0].email, username: rows[0].username } });
});

export default router;
