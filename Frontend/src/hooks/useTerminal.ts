import { useEffect } from 'react'
import { getSocket } from '../lib/socket'
import useEditorStore from '../store/editorStore'
import type { TerminalLine } from '../types'

/* ============================================================
   useTerminal — listen to terminal socket events
   Call this in EditorPage on mount
   ============================================================ */

export const useTerminal = (roomId: string) => {
  const socket = getSocket()
  const {
    terminalLines,
    isRunning,
    addTerminalLine,
    clearTerminal,
    setIsRunning,
  } = useEditorStore()

  /* ── Listen to terminal events ────────────────────────── */
  useEffect(() => {
    if (!roomId) return

    // Output line received
    socket.on('terminal:output', (line: TerminalLine) => {
      addTerminalLine(line)
    })

    // Execution finished
    socket.on('terminal:done', (data: TerminalLine) => {
      addTerminalLine(data)
      setIsRunning(false)
    })

    // Error from server
    socket.on('terminal:error', (data: { text: string }) => {
      addTerminalLine({
        type:      'err',
        text:      data.text,
        timestamp: Date.now(),
      })
      setIsRunning(false)
    })

    // Clear terminal for everyone
    socket.on('terminal:clear', () => {
      clearTerminal()
    })

    return () => {
      socket.off('terminal:output')
      socket.off('terminal:done')
      socket.off('terminal:error')
      socket.off('terminal:clear')
    }
  }, [roomId])

  return {
    terminalLines,
    isRunning,
    clearTerminal,
  }
}