import { useEffect, useCallback } from 'react'
import { useNavigate }     from 'react-router-dom'
import { getSocket }       from '../lib/socket'
import useRoomStore        from '../store/roomstore'
import useAuthStore        from '../store/authstore'
import useEditorStore      from '../store/editorStore'
import type {
  OnlineUser,
  UserJoinedPayload,
  CursorUpdatePayload,
} from '../types'

/* ============================================================
   useRoom — join/leave room, presence, members
   Call this in EditorPage on mount
   ============================================================ */

export const useRoom = (roomId: string) => {
  const navigate    = useNavigate()
  const socket      = getSocket()

  const { user }    = useAuthStore()
  const {
    currentRoom,
    onlineUsers,
    fetchRoom,
    addOnlineUser,
    removeOnlineUser,
    setOnlineUsers,
    leaveRoom,
  } = useRoomStore()

  const { resetEditor } = useEditorStore()

  /* ── Fetch room data on mount ─────────────────────────── */
  useEffect(() => {
    if (!roomId) return
    fetchRoom(roomId)
  }, [roomId])

  /* ── Join room via socket ─────────────────────────────── */
  useEffect(() => {
    if (!roomId || !user) return

    // Tell server we joined
    socket.emit('room:join', {
      roomId,
      userId:   user.id,
      username: user.username,
    })

    // Get existing users in room
    socket.on('room:users', (data: { users: OnlineUser[] }) => {
      setOnlineUsers(data.users)
    })

    // Someone else joined
    socket.on('user:joined', (data: UserJoinedPayload) => {
      addOnlineUser({
        socketId: data.socketId,
        userId:   data.userId,
        username: data.username,
        color:    data.color,
      })
    })

    // Someone left
    socket.on('user:left', (data: { socketId: string }) => {
      removeOnlineUser(data.socketId)
    })

    // Cleanup on unmount
    return () => {
      socket.emit('room:leave', { roomId })
      socket.off('room:users')
      socket.off('user:joined')
      socket.off('user:left')
    }
  }, [roomId, user])

  /* ── Leave room ───────────────────────────────────────── */
  const handleLeave = useCallback(async () => {
    try {
      // Tell socket server
      socket.emit('room:leave', { roomId })

      // Tell REST API
      await leaveRoom(roomId)

      // Reset editor state
      resetEditor()

      // Navigate home
      navigate('/home')
    } catch (err) {
      console.error('Leave room error:', err)
      navigate('/home')
    }
  }, [roomId])

  return {
    currentRoom,
    onlineUsers,
    handleLeave,
  }
}