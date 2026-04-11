import { Router, Response } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import {
  findUserById,
  updateUser,
  deleteUser,
} from '../models/user'

const router = Router()

/* ── Validation schemas ───────────────────────────────────── */
const updateUserSchema = Joi.object({
  username: Joi.string().min(2).max(30),
  email:    Joi.string().email(),
})

/* ============================================================
   GET /api/users/me
   Get logged in user profile
   ============================================================ */
router.get(
  '/me',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.user!.userId)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(user)
    } catch (err) {
      console.error('GET /users/me error:', err)
      res.status(500).json({ error: 'Failed to fetch profile' })
    }
  }
)

/* ============================================================
   PATCH /api/users/me
   Update logged in user profile
   ============================================================ */
router.patch(
  '/me',
  authMiddleware,
  validate(updateUserSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await updateUser(
        req.user!.userId,
        req.body
      )
      res.json(user)
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message })
      }
      console.error('PATCH /users/me error:', err)
      res.status(500).json({ error: 'Failed to update profile' })
    }
  }
)

/* ============================================================
   DELETE /api/users/me
   Delete logged in user account
   ============================================================ */
router.delete(
  '/me',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      await deleteUser(req.user!.userId)
      res.status(204).send()
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message })
      }
      console.error('DELETE /users/me error:', err)
      res.status(500).json({ error: 'Failed to delete account' })
    }
  }
)

/* ============================================================
   GET /api/users/:id
   Get any user by ID (public profile)
   ============================================================ */
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.params.id as string)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json({
        id:         user.id,
        username:   user.username,
        created_at: user.created_at,
      })
    } catch (err) {
      console.error('GET /users/:id error:', err)
      res.status(500).json({ error: 'Failed to fetch user' })
    }
  }
)

export default router