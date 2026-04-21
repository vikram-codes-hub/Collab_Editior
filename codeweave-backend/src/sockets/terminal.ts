import { Server, Socket } from 'socket.io'
import { runCode, RunResult } from '../services/coderunner'
import { publish, subscribe } from '../services/redis'

/* ============================================================
   Terminal socket handlers
   Events:
     CLIENT → SERVER: terminal:run, terminal:stop
     SERVER → CLIENT: terminal:output, terminal:done, terminal:error
   ============================================================ */

// Track running processes per room so we can "stop" them
const runningRooms = new Set<string>()

export const registerTerminalHandlers = (io: Server, socket: Socket) => {

  // ── terminal:run ─────────────────────────────────────────
  // Client sends code + language, we execute and broadcast
  socket.on('terminal:run', async (data: {
    roomId:   string
    code:     string
    language: string
    userId:   string
    username: string
  }) => {
    const { roomId, code, language: rawLang, userId, username } = data
    const language = rawLang.toLowerCase() // normalize for LANG_RUNTIME lookup
    const displayLang = language.charAt(0).toUpperCase() + language.slice(1)

    // Don't allow two runs at once in same room
    if (runningRooms.has(roomId)) {
      socket.emit('terminal:error', {
        text: 'Another process is already running in this room',
      })
      return
    }

    runningRooms.add(roomId)

    // Broadcast to everyone in room that execution started
    io.to(roomId).emit('terminal:output', {
      type:      'cmd',
      text:      `▶ ${username} ran ${displayLang}`,
      timestamp: Date.now(),
    })

    io.to(roomId).emit('terminal:output', {
      type:      'info',
      text:      'Compiling and running…',
      timestamp: Date.now(),
    })

    try {
      const result: RunResult = await runCode(code, language)

      // Broadcast stdout
      if (result.stdout) {
        io.to(roomId).emit('terminal:output', {
          type:      'out',
          text:      result.stdout,
          timestamp: Date.now(),
        })
      }

      // Broadcast stderr
      if (result.stderr) {
        io.to(roomId).emit('terminal:output', {
          type:      'err',
          text:      result.stderr,
          timestamp: Date.now(),
        })
      }

      // Done message
      const status = result.exitCode === 0 ? '✓' : '✗'
      io.to(roomId).emit('terminal:done', {
        type:      'info',
        text:      `${status} Exited with code ${result.exitCode} · ${result.runtime}ms`,
        exitCode:  result.exitCode,
        runtime:   result.runtime,
        timestamp: Date.now(),
      })

      // Publish to Redis so other server instances also broadcast
      await publish(`terminal:${roomId}`, {
        type:     'done',
        exitCode: result.exitCode,
        runtime:  result.runtime,
      })

    } catch (err: any) {
      io.to(roomId).emit('terminal:error', {
        type:      'err',
        text:      `Error: ${err.message ?? 'Execution failed'}`,
        timestamp: Date.now(),
      })
    } finally {
      runningRooms.delete(roomId)
    }
  })

  // ── terminal:stop ─────────────────────────────────────────
  // Client requests to stop current execution
  socket.on('terminal:stop', (data: { roomId: string }) => {
    const { roomId } = data

    if (!runningRooms.has(roomId)) return

    runningRooms.delete(roomId)

    io.to(roomId).emit('terminal:output', {
      type:      'warn',
      text:      '⊘ Process stopped by user',
      timestamp: Date.now(),
    })
  })

  // ── terminal:clear ────────────────────────────────────────
  // Client requests to clear terminal for everyone in room
  socket.on('terminal:clear', (data: { roomId: string }) => {
    io.to(data.roomId).emit('terminal:clear')
  })
}