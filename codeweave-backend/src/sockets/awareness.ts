import { Server, Socket } from 'socket.io'

/* ============================================================
   Awareness handlers
   Awareness = lightweight presence state per user
   e.g. { isTyping, selection, cursorColor, name }
   
   Events:
     CLIENT → SERVER: awareness:update
     SERVER → CLIENT: awareness:update
   ============================================================ */

export const registerAwarenessHandlers = (io: Server, socket: Socket) => {
  socket.on('awareness:update', (data: {
    roomId: string
    state: {
      userId?:      string
      username?:    string
      color?:       string
      isTyping?:    boolean
      selection?:   { start: number; end: number } | null
      cursorPos?:   { lineNumber: number; column: number } | null
    }
  }) => {
    const { roomId, state } = data

    // Broadcast to everyone else in the room
    socket.to(roomId).emit('awareness:update', {
      socketId: socket.id,
      state,
    })
  })

  socket.on('awareness:ping', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('awareness:ping', {
      socketId: socket.id,
    })
  })
}