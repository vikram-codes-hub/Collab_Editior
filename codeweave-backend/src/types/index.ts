/* ============================================================
   Depot — Shared TypeScript Types
   Used across backend routes, models, sockets
   ============================================================ */

/* ── User ─────────────────────────────────────────────────── */
export interface User {
  id:         string
  email:      string
  username:   string
  created_at: Date
}

export interface AuthUser {
  userId:   string
  email:    string
  username: string
}

export interface CreateUserInput {
  email:    string
  username: string
  password: string
}

/* ── Room ─────────────────────────────────────────────────── */
export interface Room {
  id:           string
  name:         string
  language:     string
  created_by:   string
  created_at:   Date
  creator?:     string
  member_count?: number
  online_count?: number
}

export interface CreateRoomInput {
  name:      string
  language:  string
  createdBy: string
}

export interface RoomMember {
  id:         string
  username:   string
  email:      string
  joined_at:  Date
}

/* ── Note ─────────────────────────────────────────────────── */
export interface Note {
  id:         string
  room_id:    string
  content:    string
  updated_by: string
  updated_at: Date
  username?:  string
}

/* ── Snapshot ─────────────────────────────────────────────── */
export interface Snapshot {
  id:       string
  room_id:  string
  content:  Buffer
  saved_at: Date
}

/* ── Code execution ───────────────────────────────────────── */
export interface RunResult {
  stdout:   string
  stderr:   string
  exitCode: number
  runtime:  number
}

export interface ExecuteRequest {
  code:     string
  language: string
  roomId:   string
}

/* ── Socket events ────────────────────────────────────────── */

// Client → Server
export interface RoomJoinPayload {
  roomId:   string
  userId:   string
  username: string
}

export interface CursorMovePayload {
  roomId:   string
  userId:   string
  position: {
    lineNumber: number
    column:     number
  }
}

export interface AwarenessPayload {
  roomId: string
  state: {
    userId?:    string
    username?:  string
    color?:     string
    isTyping?:  boolean
    selection?: { start: number; end: number } | null
    cursorPos?: { lineNumber: number; column: number } | null
  }
}

export interface TerminalRunPayload {
  roomId:   string
  code:     string
  language: string
  userId:   string
  username: string
}

// Server → Client
export interface TerminalOutputPayload {
  type:      'cmd' | 'out' | 'err' | 'info' | 'warn'
  text:      string
  timestamp: number
}

export interface UserJoinedPayload {
  socketId: string
  userId:   string
  username: string
  color:    string
}

export interface CursorUpdatePayload {
  socketId: string
  userId:   string
  username: string
  color:    string
  position: {
    lineNumber: number
    column:     number
  }
}

/* ── WebRTC ───────────────────────────────────────────────── */
export interface WebRTCOfferPayload {
  targetSocketId: string
  offer:          RTCSessionDescriptionInit
  userId:         string
  username:       string
}

export interface WebRTCAnswerPayload {
  targetSocketId: string
  answer:         RTCSessionDescriptionInit
}

export interface WebRTCIceCandidatePayload {
  targetSocketId: string
  candidate:      RTCIceCandidateInit
}

/* ── JWT ──────────────────────────────────────────────────── */
export interface JwtPayload {
  userId: string
  email:  string
  iat:    number
  exp:    number
}

/* ── API responses ────────────────────────────────────────── */
export interface ApiError {
  error:    string
  details?: string[]
}

export interface ApiSuccess {
  message: string
}