import { Router, Response } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimiter'
import {
  createRoom,
  getAllRooms,
  getRoomById,
  getRoomMembers,
  getUserRooms,
  joinRoom,
  leaveRoom,
  updateRoom,
  deleteRoom,
  isRoomMember,
} from '../models/room'
import {
  getRoomPresence,
} from '../services/redis'

const router = Router()

/* ── Validation schemas ───────────────────────────────────── */
const createRoomSchema = Joi.object({
  name:     Joi.string().min(2).max(60).required(),
  language: Joi.string().default('javascript'),
})

const updateRoomSchema = Joi.object({
  name:     Joi.string().min(2).max(60),
  language: Joi.string(),
})

/* ============================================================
   GET /api/rooms
   All rooms with member + online count
   ============================================================ */
router.get(
  '/',
  authMiddleware,
  apiLimiter,
  async (_req, res: Response) => {
    try {
      const rooms = await getAllRooms()

      // Attach online count from Redis for each room
      const withPresence = await Promise.all(
        rooms.map(async (room) => {
          const online = await getRoomPresence(room.id)
          return { ...room, online_count: online.length }
        })
      )

      res.json(withPresence)
    } catch (err) {
      console.error('GET /rooms error:', err)
      res.status(500).json({ error: 'Failed to fetch rooms' })
    }
  }
)

/* ============================================================
   GET /api/rooms/mine
   Rooms the logged-in user is a member of
   ============================================================ */
router.get(
  '/mine',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const rooms = await getUserRooms(req.user!.userId)

      const withPresence = await Promise.all(
        rooms.map(async (room) => {
          const online = await getRoomPresence(room.id)
          return { ...room, online_count: online.length }
        })
      )

      res.json(withPresence)
    } catch (err) {
      console.error('GET /rooms/mine error:', err)
      res.status(500).json({ error: 'Failed to fetch your rooms' })
    }
  }
)

/* ============================================================
   GET /api/rooms/:id
   Single room with members + online users
   ============================================================ */
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await getRoomById(req.params.id as string)
      if (!room) {
        return res.status(404).json({ error: 'Room not found' })
      }

      const [members, online] = await Promise.all([
        getRoomMembers(req.params.id as string),
        getRoomPresence(req.params.id as string),
      ])

      res.json({
        ...room,
        members,
        online_count: online.length,
        online_users: online,
      })
    } catch (err) {
      console.error('GET /rooms/:id error:', err)
      res.status(500).json({ error: 'Failed to fetch room' })
    }
  }
)

/* ============================================================
   POST /api/rooms
   Create a room
   ============================================================ */
router.post(
  '/',
  authMiddleware,
  apiLimiter,
  validate(createRoomSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await createRoom({
        name:      req.body.name,
        language:  req.body.language,
        createdBy: req.user!.userId,
      })

      res.status(201).json(room)
    } catch (err: any) {
      console.error('POST /rooms error:', err)
      res.status(500).json({ error: 'Failed to create room' })
    }
  }
)

/* ============================================================
   PATCH /api/rooms/:id
   Update room name or language (creator only)
   ============================================================ */
router.patch(
  '/:id',
  authMiddleware,
  validate(updateRoomSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await updateRoom(
        req.params.id as string,
        req.user!.userId,
        req.body
      )
      res.json(room)
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message })
      }
      console.error('PATCH /rooms/:id error:', err)
      res.status(500).json({ error: 'Failed to update room' })
    }
  }
)

/* ============================================================
   DELETE /api/rooms/:id
   Delete room (creator only)
   ============================================================ */
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      await deleteRoom(req.params.id as string, req.user!.userId)
      res.status(204).send()
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message })
      }
      console.error('DELETE /rooms/:id error:', err)
      res.status(500).json({ error: 'Failed to delete room' })
    }
  }
)

/* ============================================================
   POST /api/rooms/:id/join
   Join a room as a member
   ============================================================ */
router.post(
  '/:id/join',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      await joinRoom(req.params.id as string, req.user!.userId)
      res.json({ message: 'Joined room successfully' })
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message })
      }
      console.error('POST /rooms/:id/join error:', err)
      res.status(500).json({ error: 'Failed to join room' })
    }
  }
)

/* ============================================================
   POST /api/rooms/:id/leave
   Leave a room
   ============================================================ */
router.post(
  '/:id/leave',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      await leaveRoom(req.params.id as string, req.user!.userId)
      res.json({ message: 'Left room successfully' })
    } catch (err: any) {
      console.error('POST /rooms/:id/leave error:', err)
      res.status(500).json({ error: 'Failed to leave room' })
    }
  }
)

/* ============================================================
   GET /api/rooms/:id/members
   Get all members of a room
   ============================================================ */
router.get(
  '/:id/members',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await getRoomById(req.params.id as string)
      if (!room) {
        return res.status(404).json({ error: 'Room not found' })
      }

      const members = await getRoomMembers(req.params.id as string)
      res.json(members)
    } catch (err) {
      console.error('GET /rooms/:id/members error:', err)
      res.status(500).json({ error: 'Failed to fetch members' })
    }
  }
)

/* ============================================================
   GET /api/rooms/:id/online
   Get currently online users in a room (from Redis)
   ============================================================ */
router.get(
  '/:id/online',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const online = await getRoomPresence(req.params.id as string)
      res.json({ online_count: online.length, users: online })
    } catch (err) {
      console.error('GET /rooms/:id/online error:', err)
      res.status(500).json({ error: 'Failed to fetch online users' })
    }
  }
)

/* ============================================================
   GET /api/rooms/:id/check-member
   Check if logged in user is member of room
   ============================================================ */
router.get(
  '/:id/check-member',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const member = await isRoomMember(
        req.params.id as string,
        req.user!.userId
      )
      res.json({ isMember: member })
    } catch (err) {
      console.error('GET /rooms/:id/check-member error:', err)
      res.status(500).json({ error: 'Failed to check membership' })
    }
  }
)

export default router