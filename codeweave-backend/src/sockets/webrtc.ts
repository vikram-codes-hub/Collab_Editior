import { Server, Socket } from 'socket.io'



// Track who is in which room for WebRTC
// roomId → Set of socketIds
const roomPeers = new Map<string, Set<string>>()

export const registerWebRTCHandlers = (io: Server, socket: Socket) => {

  // ── webrtc:join ───────────────────────────────────────────
  // User joins the video room — notify existing peers
  socket.on('webrtc:join', (data: {
    roomId:   string
    userId:   string
    username: string
  }) => {
    const { roomId, userId, username } = data

    // Add to room peers
    if (!roomPeers.has(roomId)) {
      roomPeers.set(roomId, new Set())
    }
    roomPeers.get(roomId)!.add(socket.id)

    // Tell this user who is already in the room
    // so they can initiate offers to each existing peer
    const existingPeers = Array.from(roomPeers.get(roomId)!)
      .filter(id => id !== socket.id)

    socket.emit('webrtc:existing-peers', {
      peers: existingPeers,
    })

    // Tell everyone else a new user joined
    // so they know to expect an offer from this user
    socket.to(roomId).emit('webrtc:user-joined', {
      socketId: socket.id,
      userId,
      username,
    })

    console.log(`🎥 ${username} joined WebRTC room: ${roomId}`)
  })

  // ── webrtc:offer ──────────────────────────────────────────
  // Caller sends offer SDP to a specific peer
  socket.on('webrtc:offer', (data: {
    targetSocketId: string
    offer:          RTCSessionDescriptionInit
    userId:         string
    username:       string
  }) => {
    const { targetSocketId, offer, userId, username } = data

    // Forward offer to the target peer only
    io.to(targetSocketId).emit('webrtc:offer', {
      offer,
      fromSocketId: socket.id,
      userId,
      username,
    })
  })

  // ── webrtc:answer ─────────────────────────────────────────
  // Callee sends answer SDP back to caller
  socket.on('webrtc:answer', (data: {
    targetSocketId: string
    answer:         RTCSessionDescriptionInit
  }) => {
    const { targetSocketId, answer } = data

    // Forward answer back to caller
    io.to(targetSocketId).emit('webrtc:answer', {
      answer,
      fromSocketId: socket.id,
    })
  })

  // ── webrtc:ice-candidate ──────────────────────────────────
  // Exchange ICE candidates between peers
  // ICE candidates are network paths the peers can use
  socket.on('webrtc:ice-candidate', (data: {
    targetSocketId: string
    candidate:      RTCIceCandidateInit
  }) => {
    const { targetSocketId, candidate } = data

    // Forward ICE candidate to the target peer
    io.to(targetSocketId).emit('webrtc:ice-candidate', {
      candidate,
      fromSocketId: socket.id,
    })
  })

  // ── webrtc:leave ──────────────────────────────────────────
  // User leaves video — notify all peers to close connection
  socket.on('webrtc:leave', (data: { roomId: string }) => {
    const { roomId } = data
    handlePeerLeave(io, socket, roomId)
  })

  // ── Handle disconnect ─────────────────────────────────────
  // Clean up if socket disconnects without sending webrtc:leave
  socket.on('disconnect', () => {
    // Find which rooms this socket was in and clean up
    roomPeers.forEach((peers, roomId) => {
      if (peers.has(socket.id)) {
        handlePeerLeave(io, socket, roomId)
      }
    })
  })
}

// ── Helper: handle a peer leaving ─────────────────────────
const handlePeerLeave = (io: Server, socket: Socket, roomId: string) => {
  const peers = roomPeers.get(roomId)
  if (!peers) return

  peers.delete(socket.id)

  // Clean up empty rooms
  if (peers.size === 0) {
    roomPeers.delete(roomId)
  }

  // Tell remaining peers this user left
  // so they can close the peer connection on their side
  socket.to(roomId).emit('webrtc:user-left', {
    socketId: socket.id,
  })

  console.log(`🎥 Socket ${socket.id} left WebRTC room: ${roomId}`)
}