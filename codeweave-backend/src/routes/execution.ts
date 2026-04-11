import { Router, Response } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { executionLimiter } from '../middleware/rateLimiter'
import { runCode } from '../services/coderunner'
import { isRoomMember } from '../models/room'

const router = Router()

/* ── Validation schema ────────────────────────────────────── */
const executeSchema = Joi.object({
  code:     Joi.string().max(50_000).required(),
  language: Joi.string().required(),
  roomId:   Joi.string().uuid().required(),
})

/* ============================================================
   POST /api/execution/run
   Run code via Piston API
   Broadcasts output to room via Socket.io
   ============================================================ */
router.post(
  '/run',
  authMiddleware,
  executionLimiter,
  validate(executeSchema),
  async (req: AuthRequest, res: Response) => {
    const { code, language, roomId } = req.body

    try {
      // Must be room member to run code
      const member = await isRoomMember(roomId, req.user!.userId)
      if (!member) {
        return res.status(403).json({
          error: 'Not a member of this room',
        })
      }

      const result = await runCode(code, language)

      // Return result to caller
      // Socket.io broadcast happens in sockets/terminal.ts
      res.json({
        stdout:   result.stdout,
        stderr:   result.stderr,
        exitCode: result.exitCode,
        runtime:  result.runtime,
        language,
      })
    } catch (err: any) {
      console.error('POST /execution/run error:', err)

      if (err.message?.includes('Unsupported language')) {
        return res.status(400).json({ error: err.message })
      }
      if (err.message?.includes('maximum size')) {
        return res.status(400).json({ error: err.message })
      }

      res.status(500).json({ error: 'Code execution failed' })
    }
  }
)

/* ============================================================
   GET /api/execution/languages
   Return list of supported languages
   ============================================================ */
router.get('/languages', async (_req, res: Response) => {
  const { LANG_RUNTIME } = await import('../constant')

  const languages = Object.keys(LANG_RUNTIME).map(key => ({
    id:       key,
    name:     key.charAt(0).toUpperCase() + key.slice(1),
    version:  LANG_RUNTIME[key].version,
  }))

  res.json(languages)
})

export default router