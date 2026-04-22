// useWebRTC.ts
// Full WebRTC hook: local media acquisition + peer connection management
// Signals via Socket.io (webrtc:join / offer / answer / ice-candidate / leave)

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSocket } from '../lib/socket'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

interface RemotePeer {
  socketId:   string
  userId:     string
  username:   string
  stream:     MediaStream | null
  videoRef:   React.RefObject<HTMLVideoElement>
}

interface UseWebRTCReturn {
  localStream:    MediaStream | null
  localVideoRef:  React.RefObject<HTMLVideoElement>
  remotePeers:    RemotePeer[]
  micOn:          boolean
  camOn:          boolean
  toggleMic:      () => void
  toggleCam:      () => void
  joinVideoRoom:  () => void
  leaveVideoRoom: () => void
  hasJoined:      boolean
  permissionError: string | null
}

export function useWebRTC(
  roomId:   string,
  userId:   string,
  username: string,
): UseWebRTCReturn {
  const [localStream,     setLocalStream]     = useState<MediaStream | null>(null)
  const [remotePeers,     setRemotePeers]     = useState<RemotePeer[]>([])
  const [micOn,           setMicOn]           = useState(true)
  const [camOn,           setCamOn]           = useState(false)
  const [hasJoined,       setHasJoined]       = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConns      = useRef<Map<string, RTCPeerConnection>>(new Map())

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const makeVideoRef = (): React.RefObject<HTMLVideoElement> =>
    ({ current: null } as React.RefObject<HTMLVideoElement>)

  const createPeerConn = useCallback((targetSocketId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    const socket = getSocket()

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!)
    })

    // ICE candidate → forward via socket
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('webrtc:ice-candidate', { targetSocketId, candidate })
      }
    }

    // Remote stream arrived
    pc.ontrack = (event) => {
      const [stream] = event.streams
      setRemotePeers(prev => prev.map(p =>
        p.socketId === targetSocketId
          ? { ...p, stream }
          : p
      ))
      // Attach stream to video element
      setTimeout(() => {
        setRemotePeers(prev => {
          const peer = prev.find(p => p.socketId === targetSocketId)
          if (peer?.videoRef.current && stream) {
            peer.videoRef.current.srcObject = stream
          }
          return prev
        })
      }, 50)
    }

    peerConns.current.set(targetSocketId, pc)
    return pc
  }, [])

  const closePeer = useCallback((socketId: string) => {
    const pc = peerConns.current.get(socketId)
    if (pc) {
      pc.close()
      peerConns.current.delete(socketId)
    }
    setRemotePeers(prev => prev.filter(p => p.socketId !== socketId))
  }, [])

  // ── Acquire local media ───────────────────────────────────────────────────────
  const acquireMedia = useCallback(async (withVideo: boolean) => {
    try {
      // Stop existing tracks first
      localStreamRef.current?.getTracks().forEach(t => t.stop())

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      })

      localStreamRef.current = stream
      setLocalStream(stream)
      setPermissionError(null)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Replace tracks on existing peer connections
      peerConns.current.forEach(pc => {
        stream.getTracks().forEach(track => {
          const sender = pc.getSenders().find(s => s.track?.kind === track.kind)
          if (sender) sender.replaceTrack(track)
          else pc.addTrack(track, stream)
        })
      })

      return stream
    } catch (err: any) {
      console.error('Media acquisition failed:', err)
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera/mic permission denied. Please allow access in your browser.'
          : err.name === 'NotFoundError'
          ? 'No camera or microphone found.'
          : 'Could not access media devices.'
      )
      return null
    }
  }, [])

  // ── Join / Leave ─────────────────────────────────────────────────────────────
  const joinVideoRoom = useCallback(async () => {
    if (hasJoined) return
    const stream = await acquireMedia(camOn)
    if (!stream) return

    const socket = getSocket()
    socket.emit('webrtc:join', { roomId, userId, username })
    setHasJoined(true)
  }, [hasJoined, camOn, acquireMedia, roomId, userId, username])

  const leaveVideoRoom = useCallback(() => {
    const socket = getSocket()
    socket.emit('webrtc:leave', { roomId })

    // Close all peer connections
    peerConns.current.forEach((_, id) => closePeer(id))
    peerConns.current.clear()

    // Stop local tracks
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemotePeers([])
    setHasJoined(false)
  }, [roomId, closePeer])

  // ── Mic / Cam toggles ────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    setMicOn(prev => {
      const next = !prev
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = next })
      return next
    })
  }, [])

  const toggleCam = useCallback(async () => {
    const next = !camOn
    setCamOn(next)
    if (hasJoined) {
      await acquireMedia(next)
    }
  }, [camOn, hasJoined, acquireMedia])

  // ── Socket event handlers ────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return
    const socket = getSocket()

    // We joined — here are the existing peers in the room
    socket.on('webrtc:existing-peers', async ({ peers }: { peers: string[] }) => {
      for (const peerSocketId of peers) {
        const pc = createPeerConn(peerSocketId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('webrtc:offer', {
          targetSocketId: peerSocketId,
          offer,
          userId,
          username,
        })
      }
    })

    // Someone new joined — they will send us an offer
    socket.on('webrtc:user-joined', ({ socketId, userId: uid, username: uname }: {
      socketId: string; userId: string; username: string
    }) => {
      const videoRef = makeVideoRef()
      setRemotePeers(prev => [
        ...prev.filter(p => p.socketId !== socketId),
        { socketId, userId: uid, username: uname, stream: null, videoRef },
      ])
      // Create PC ahead of time so it's ready for the incoming offer
      createPeerConn(socketId)
    })

    // Incoming offer → answer it
    socket.on('webrtc:offer', async ({ offer, fromSocketId, userId: uid, username: uname }: {
      offer: RTCSessionDescriptionInit; fromSocketId: string
      userId: string; username: string
    }) => {
      // Ensure we have a peer entry
      setRemotePeers(prev => {
        if (prev.find(p => p.socketId === fromSocketId)) return prev
        return [...prev, {
          socketId: fromSocketId, userId: uid, username: uname,
          stream: null, videoRef: makeVideoRef(),
        }]
      })

      let pc = peerConns.current.get(fromSocketId)
      if (!pc) pc = createPeerConn(fromSocketId)

      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc:answer', { targetSocketId: fromSocketId, answer })
    })

    // Incoming answer
    socket.on('webrtc:answer', async ({ answer, fromSocketId }: {
      answer: RTCSessionDescriptionInit; fromSocketId: string
    }) => {
      const pc = peerConns.current.get(fromSocketId)
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(answer)
      }
    })

    // Incoming ICE candidate
    socket.on('webrtc:ice-candidate', async ({ candidate, fromSocketId }: {
      candidate: RTCIceCandidateInit; fromSocketId: string
    }) => {
      const pc = peerConns.current.get(fromSocketId)
      if (pc) {
        try { await pc.addIceCandidate(candidate) } catch { /* ignore */ }
      }
    })

    // A peer left
    socket.on('webrtc:user-left', ({ socketId }: { socketId: string }) => {
      closePeer(socketId)
    })

    return () => {
      socket.off('webrtc:existing-peers')
      socket.off('webrtc:user-joined')
      socket.off('webrtc:offer')
      socket.off('webrtc:answer')
      socket.off('webrtc:ice-candidate')
      socket.off('webrtc:user-left')
    }
  }, [roomId, userId, username, createPeerConn, closePeer])

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      peerConns.current.forEach(pc => pc.close())
    }
  }, [])

  return {
    localStream,
    localVideoRef,
    remotePeers,
    micOn,
    camOn,
    toggleMic,
    toggleCam,
    joinVideoRoom,
    leaveVideoRoom,
    hasJoined,
    permissionError,
  }
}
