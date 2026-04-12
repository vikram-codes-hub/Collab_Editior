import { useEffect, useRef, useState } from 'react'
import * as monaco                      from 'monaco-editor'
import { MonacoBinding }                from 'y-monaco'
import { connectYjs, disconnectYjs, getAwarenessUsers } from '../lib/yjs'
import { getSocket }                    from '../lib/socket'
import useAuthStore                     from '../store/authstore'
import { PRESENCE_COLORS }              from '../lib/constants'
import type { RemoteCursor }            from '../types'

/* ============================================================
   useCollaboration — Yjs + Monaco binding + cursors
   Call this in EditorPage after Monaco mounts
   ============================================================ */

export const useCollaboration = (
  roomId:   string,
  colorIdx: number = 0
) => {
  const { user }  = useAuthStore()
  const socket    = getSocket()

  const bindingRef  = useRef<MonacoBinding | null>(null)
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([])
  const [yjsConnected, setYjsConnected]   = useState(false)

  /* ── Connect Yjs on mount ─────────────────────────────── */
  useEffect(() => {
    if (!roomId || !user) return

    const room = connectYjs(
      roomId,
      user.id,
      user.username,
      colorIdx
    )

    // Track connection status
    room.provider.on('status', (e: { status: string }) => {
      setYjsConnected(e.status === 'connected')
    })

    // Track awareness changes (other users' cursors)
    room.provider.awareness.on('change', () => {
      const users = getAwarenessUsers(roomId)
      const cursors: RemoteCursor[] = users
        .filter(u => u.userId !== user.id)
        .map((u, i) => ({
          userId:     u.userId     ?? '',
          username:   u.username   ?? 'Unknown',
          color:      u.color      ?? PRESENCE_COLORS[i % PRESENCE_COLORS.length],
          lineNumber: u.cursorPos?.lineNumber ?? 1,
          column:     u.cursorPos?.column     ?? 1,
        }))

      setRemoteCursors(cursors)
    })

    return () => {
      // Destroy binding before disconnecting
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }
      disconnectYjs(roomId)
    }
  }, [roomId, user])

  /* ── Bind Monaco editor to Yjs ────────────────────────── */
  const bindEditor = (
    editor: monaco.editor.IStandaloneCodeEditor
  ) => {
    if (!roomId) return

    const room = connectYjs(roomId, user!.id, user!.username, colorIdx)

    // Destroy previous binding if exists
    if (bindingRef.current) {
      bindingRef.current.destroy()
    }

    // Bind Yjs Y.Text to Monaco model
    bindingRef.current = new MonacoBinding(
      room.text,
      editor.getModel()!,
      new Set([editor]),
      room.provider.awareness
    )

    // Track cursor position and broadcast via awareness
    editor.onDidChangeCursorPosition((e) => {
      const pos = e.position
      room.provider.awareness.setLocalStateField('user', {
        userId:   user!.id,
        username: user!.username,
        color:    PRESENCE_COLORS[colorIdx % PRESENCE_COLORS.length],
        cursorPos: {
          lineNumber: pos.lineNumber,
          column:     pos.column,
        },
      })

      // Also emit via Socket.io for cursor overlay
      socket.emit('cursor:move', {
        roomId,
        userId:   user!.id,
        position: {
          lineNumber: pos.lineNumber,
          column:     pos.column,
        },
      })
    })
  }

  return {
    bindEditor,
    remoteCursors,
    yjsConnected,
  }
}