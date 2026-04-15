import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import { validate } from '../middleware/validate'
import { authLimiter } from '../middleware/rateLimiter'
import {
  createUser,
  findUserByEmail,
  verifyPassword,
} from '../models/user'

const router = Router()

/*Validation schemas*/
const registerSchema = Joi.object({
  email:    Joi.string().email().required(),
  username: Joi.string().min(2).max(30).required(),
  password: Joi.string().min(8).required(),
})

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
})

/* ── Generate JWT ─────────────────────────────────────────── */
const signToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  )
}

/* ============================================================
   POST /api/auth/register
   ============================================================ */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const user  = await createUser(req.body)
      const token = signToken(user.id, user.email)

      res.status(201).json({
        token,
        user: {
          id:       user.id,
          email:    user.email,
          username: user.username,
        },
      })
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message })
      }
      console.error('Register error:', err)
      res.status(500).json({ error: 'Registration failed' })
    }
  }
)

/* ============================================================
   POST /api/auth/login
   ============================================================ */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      // Find user
      const user = await findUserByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Verify password
      const valid = await verifyPassword(password, user.password)
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = signToken(user.id, user.email)

      res.json({
        token,
        user: {
          id:       user.id,
          email:    user.email,
          username: user.username,
        },
      })
    } catch (err: any) {
      console.error('Login error:', err)
      res.status(500).json({ error: 'Login failed' })
    }
  }
)

/* ============================================================
   POST /api/auth/logout
   Client just deletes token — this is for future
   server-side token blacklisting via Redis
   ============================================================ */
router.post('/logout', async (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' })
})

export default router