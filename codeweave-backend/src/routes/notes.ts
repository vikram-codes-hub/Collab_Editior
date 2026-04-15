import { Router, Response } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimiter'
import { getNoteByUserId, saveNote, clearNote } from '../models/note'
import { isRoomMember } from '../models/room'

const router = Router()

const saveNoteSchema = Joi.object({
  content: Joi.string().allow('').max(100_000).required(),
})

/* ============================================================
   GET /api/notes/:roomId
   Returns ONLY the current user's private note.
   Other users' notes are never returned.
   ============================================================ */
router.get(
  '/:roomId',
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

      const note = await getNoteByUserId(
        req.params.roomId as string,
        req.user!.userId
      )

      // Return empty content if no note exists yet — no attribution info
      res.json({ content: note?.content ?? '' })
    } catch (err) {
      console.error('GET /notes/:roomId error:', err)
      res.status(500).json({ error: 'Failed to fetch note' })
    }
  }
)

/* ============================================================
   PUT /api/notes/:roomId
   Saves the current user's private note. No other user's data
   is touched or exposed.
   ============================================================ */
router.put(
  '/:roomId',
  authMiddleware,
  apiLimiter,
  validate(saveNoteSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const member = await isRoomMember(
        req.params.roomId as string,
        req.user!.userId
      )
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this room' })
      }

      await saveNote(
        req.params.roomId as string,
        req.user!.userId,
        req.body.content
      )

      res.json({ ok: true })
    } catch (err) {
      console.error('PUT /notes/:roomId error:', err)
      res.status(500).json({ error: 'Failed to save note' })
    }
  }
)

/* ============================================================
   DELETE /api/notes/:roomId/clear
   Clear the current user's own note content.
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
      res.json({ ok: true })
    } catch (err) {
      console.error('DELETE /notes/:roomId/clear error:', err)
      res.status(500).json({ error: 'Failed to clear note' })
    }
  }
)

export default router