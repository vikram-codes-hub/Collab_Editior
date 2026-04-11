import { io, Socket } from 'socket.io-client'
import { WS_URL, TOKEN_KEY } from './constants'

/*Socket.io singleton
One connection shared across the entire app
Reconnects automatically with JWT auth*/

let socket: Socket | null = null

/*Get or create socket instance*/
export const getSocket = (): Socket => {
  if (socket?.connected) return socket

  socket = io(WS_URL, {
    auth: {
      token: localStorage.getItem(TOKEN_KEY),
    },
    transports:       ['websocket', 'polling'],
    reconnection:     true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout:          10_000,
  })

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message)
  })

  return socket
}

/*Disconnect socket*/
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/*Emit with type safety*/
export const emit = (event: string, data?: object): void => {
  const s = getSocket()
  s.emit(event, data)
}

/*Listen to event once*/
export const once = (
  event:   string,
  handler: (...args: any[]) => void
): void => {
  const s = getSocket()
  s.once(event, handler)
}

export { socket }