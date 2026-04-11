/*
   Depot — Frontend Shared Types
*/

/*User*/
export interface User {
  id:         string
  email:      string
  username:   string
  created_at?: string
}

export interface AuthUser {
  userId:   string
  email:    string
  username: string
}

/*Auth*/
export interface LoginInput {
  email:    string
  password: string
}

export interface RegisterInput {
  email:    string
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user:  User
}

/*Room*/
export interface Room {
  id:           string
  name:         string
  language:     string
  created_by:   string
  created_at:   string
  creator?:     string
  member_count?: number
  online_count?: number
  members?:     RoomMember[]
  online_users?: OnlineUser[]
}

export interface CreateRoomInput {
  name:     string
  language: string
}

export interface RoomMember {
  id:        string
  username:  string
  email:     string
  joined_at: string
}

export interface OnlineUser {
  userId:   string
  username: string
  color:    string
  socketId: string
}

/*Note*/
export interface Note {
  id?:        string
  room_id:    string
  content:    string
  updated_by?: string
  updated_at?: string
  username?:  string
}

/*Terminal*/
export type TerminalLineType =
  | 'cmd'
  | 'out'
  | 'err'
  | 'info'
  | 'warn'

export interface TerminalLine {
  type:      TerminalLineType
  text:      string
  timestamp: number
}

export interface ExecuteRequest {
  code:     string
  language: string
  roomId:   string
}

export interface ExecuteResult {
  stdout:   string
  stderr:   string
  exitCode: number
  runtime:  number
  language: string
}

/*Socket events*/
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

export interface AwarenessState {
  userId?:    string
  username?:  string
  color?:     string
  isTyping?:  boolean
  selection?: { start: number; end: number } | null
  cursorPos?: { lineNumber: number; column: number } | null
}

export interface TerminalRunPayload {
  roomId:   string
  code:     string
  language: string
  userId:   string
  username: string
}

/*WebRTC*/
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

export interface WebRTCIcePayload {
  targetSocketId: string
  candidate:      RTCIceCandidateInit
}

export interface WebRTCUserJoined {
  socketId: string
  userId:   string
  username: string
}

/*Editor*/
export interface RemoteCursor {
  userId:     string
  username:   string
  color:      string
  lineNumber: number
  column:     number
}

export type EditorLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'rust'
  | 'cpp'
  | 'java'
  | 'html'
  | 'css'
  | 'shell'

/*API responses*/
export interface ApiError {
  error:    string
  details?: string[]
}

export interface ApiSuccess {
  message: string
}

/*UI State*/
export interface PanelState {
  notesOpen:    boolean
  videoOpen:    boolean
  terminalOpen: boolean
}