import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db/postgres'

export interface AuthRequest extends Request {
  user?: {
    userId:   string
    email:    string
    username: string
  }
}

/* ── JWT auth middleware ───────────────────────────────────
   Verifies Bearer token on every protected route
   Attaches user to req.user
   ──────────────────────────────────────────────────────── */
export const authMiddleware = async (
  req:  AuthRequest,
  res:  Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: string; email: string }

    // Verify user still exists in DB
    const { rows } = await pool.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [payload.userId]
    )

    if (!rows[0]) {
      return res.status(401).json({ error: 'User no longer exists' })
    }

    // Attach full user to request
    req.user = {
      userId:   rows[0].id,
      email:    rows[0].email,
      username: rows[0].username,
    }

    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

/* ── Optional auth ─────────────────────────────────────────
   Attaches user if token present but does NOT block request
   Used on routes that work for both guests and logged in users
   ──────────────────────────────────────────────────────── */
export const optionalAuth = async (
  req:  AuthRequest,
  res:  Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next()  // no token, continue as guest
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: string; email: string }

    const { rows } = await pool.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [payload.userId]
    )

    if (rows[0]) {
      req.user = {
        userId:   rows[0].id,
        email:    rows[0].email,
        username: rows[0].username,
      }
    }
  } catch {
    // Invalid token — continue as guest, don't block
  }

  next()
}