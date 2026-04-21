/*
   Depot — Frontend Constants
   All API URLs and config in one place
*/

const isDev = import.meta.env.MODE === 'development'

/*API base URL*/
export const API_URL = isDev
  ? 'http://localhost:4000/api'
  : import.meta.env.VITE_API_URL || '/api'

/*WebSocket URL*/
export const WS_URL = isDev
  ? 'http://localhost:4000'
  : import.meta.env.VITE_WS_URL || window.location.origin

/*Yjs WebSocket URL*/
export const YJS_URL = isDev
  ? 'ws://localhost:1234'
  : import.meta.env.VITE_YJS_URL || `wss://${window.location.host}/yjs`

/*Auth*/
export const TOKEN_KEY    = 'depot_token'
export const USER_KEY     = 'depot_user'
export const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000  // 7 days in ms

/*Editor*/
export const DEFAULT_LANGUAGE = 'TypeScript'
export const DEFAULT_THEME    = 'vs-dark'
export const DEFAULT_FONT     = 14

/*Collaboration*/
export const NOTE_SAVE_DEBOUNCE   = 2000   // 2s after user stops typing
export const PRESENCE_PING_MS     = 30_000 // ping Redis every 30s
export const SNAPSHOT_INTERVAL_MS = 30_000 // Yjs snapshot every 30s

/*User presence colors*/
export const PRESENCE_COLORS = [
  '#a78bfa',  // violet
  '#fb923c',  // orange
  '#34d399',  // green
  '#f472b6',  // pink
  '#fbbf24',  // amber
  '#60a5fa',  // blue
]