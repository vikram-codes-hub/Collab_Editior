import { Router, Response } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimiter'
import {
  getNoteByRoomId,
  saveNote,
  clearNote,
  deleteNote,
  getNoteMetadata,
} from '../models/note'
import { isRoomMember } from '../models/room'

const router = Router()

/* ── Validation schemas ───────────────────────────────────── */
const saveNoteSchema = Joi.object({
  content: Joi.string().allow('').max(100_000).required(),
})

/* ============================================================
   GET /api/notes/:roomId
   Get note for a room
   ============================================================ */
router.get(
  '/:roomId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check user is member of room
      const member = await isRoomMember(
        req.params.roomId as string,
        req.user!.userId
      )
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this room' })
      }

      const note = await getNoteByRoomId(req.params.roomId as string)

      // Return empty note if none exists yet
      if (!note) {
        return res.json({
          room_id:    req.params.roomId,
          content:    '',
          updated_by: null,
          updated_at: null,
        })
      }

      res.json(note)
    } catch (err) {
      console.error('GET /notes/:roomId error:', err)
      res.status(500).json({ error: 'Failed to fetch note' })
    }
  }
)

/* ============================================================
   PUT /api/notes/:roomId
   Save note for a room
   Called by frontend after debounce (2s after user stops typing)
   ============================================================ */
router.put(
  '/:roomId',
  authMiddleware,
  apiLimiter,
  validate(saveNoteSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check user is member of room
      const member = await isRoomMember(
        req.params.roomId as string,
        req.user!.userId
      )
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this room' })
      }

      const note = await saveNote(
        req.params.roomId as string,
        req.body.content,
        req.user!.userId
      )

      res.json(note)
    } catch (err) {
      console.error('PUT /notes/:roomId error:', err)
      res.status(500).json({ error: 'Failed to save note' })
    }
  }
)

/* ============================================================
   DELETE /api/notes/:roomId/clear
   Clear note content (not delete the note row)
   ============================================================ */
router.delete(
  '/:roomId/clear',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const member = await isRoomMember(
        req.params.roomId as string,
        req.user!.userId
      )
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this room' })
      }

      await clearNote(req.params.roomId as string, req.user!.userId)
      res.json({ message: 'Note cleared' })
    } catch (err) {
      console.error('DELETE /notes/:roomId/clear error:', err)
      res.status(500).json({ error: 'Failed to clear note' })
    }
  }
)

/* ============================================================
   GET /api/notes/:roomId/meta
   Get note metadata — who last edited and when
   ============================================================ */
router.get(
  '/:roomId/meta',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const member = await isRoomMember(
        req.params.roomId as string,
        req.user!.userId
      )
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this room' })
      }

      const meta = await getNoteMetadata(req.params.roomId as string)
      res.json(meta ?? { message: 'No note yet' })
    } catch (err) {
      console.error('GET /notes/:roomId/meta error:', err)
      res.status(500).json({ error: 'Failed to fetch note metadata' })
    }
  }
)

export default router