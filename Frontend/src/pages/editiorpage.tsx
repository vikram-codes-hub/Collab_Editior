// editorpage.tsx
// Phase 4 — Editor Room (fully wired)
// Imports real: Editor, Terminal, Notepad components
// Mock data throughout — Phase 6 swaps for real API + Yjs + Socket.io
// Fonts: Syne (room name/brand) | Inter (all UI chrome) | JetBrains Mono (code/terminal/lang)

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import * as monaco from 'monaco-editor'

import Editor from '../components/editior'
import type { RemoteCursor } from '../components/editior'
import Terminal from '../components/terminal'
import type { TerminalLine } from '../components/terminal'
import Notepad from '../components/notepad'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ROOM = {
  id:       'room-xyz',
  name:     'api-refactor',
  language: 'TypeScript',
  users: [
    { id: '1', name: 'Varun',  color: '#a78bfa', avatar: 'V', active: true  },
    { id: '2', name: 'Shreya', color: '#fb923c', avatar: 'S', active: true  },
    { id: '3', name: 'Dev',    color: '#34d399', avatar: 'D', active: false },
  ],
}

const MOCK_CODE = `// api-refactor.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateUser(
  id: string,
  payload: Partial<{ name: string; avatar: string }>
) {
  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
`

const MOCK_NOTE = `## Sprint Notes — Apr 3

- Refactor auth to use Supabase
- Fix cursor sync on reconnect
- Terminal broadcast needs debounce

> Varun: also check the Redis pub/sub lag

---

### Done
- ~~Set up Yjs CRDT~~ ✓
- ~~Monaco theme~~ ✓
`

const MOCK_REMOTE_CURSORS: RemoteCursor[] = [
  { userId: '2', name: 'Shreya', color: '#fb923c', lineNumber: 11, column: 6 },
]

const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'C++', 'Java']

// ── VideoTile ─────────────────────────────────────────────────────────────────
const VideoTile = ({
  user,
  index,
}: {
  user: typeof MOCK_ROOM.users[0]
  index: number
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.5 + index * 0.07, type: 'spring', stiffness: 260 }}
    style={{
      borderRadius:   8,
      overflow:       'hidden',
      background:     'var(--color-elevated)',
      border:         `1px solid ${user.active ? user.color + '28' : 'rgba(255,255,255,0.04)'}`,
      aspectRatio:    '4/3',
      position:       'relative',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      flexShrink:     0,
    }}
  >
    <div style={{
      width:          36,
      height:         36,
      borderRadius:   '50%',
      background:     user.color + '1a',
      border:         `2px solid ${user.color}44`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     'Inter, sans-serif',
      fontSize:       14,
      fontWeight:     700,
      color:          user.color,
    }}>
      {user.avatar}
    </div>

    {/* Speaking pulse (mock — user 1) */}
    {user.active && index === 0 && (
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.1, 0.45] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        style={{
          position:     'absolute',
          width:        52,
          height:       52,
          borderRadius: '50%',
          border:       `2px solid ${user.color}`,
          pointerEvents:'none',
        }}
      />
    )}

    {/* Name tag */}
    <div style={{
      position:   'absolute',
      bottom:     5,
      left:       6,
      fontFamily: 'Inter, sans-serif',
      fontSize:   10,
      fontWeight: 500,
      color:      'rgba(255,255,255,0.75)',
      background: 'rgba(0,0,0,0.55)',
      borderRadius: 3,
      padding:    '1px 5px',
    }}>
      {user.name}
    </div>

    {/* Offline overlay */}
    {!user.active && (
      <div style={{
        position:       'absolute',
        inset:          0,
        background:     'rgba(13,13,16,0.65)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily:    'Inter, sans-serif',
          fontSize:      9,
          color:         'var(--color-text-hint)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          offline
        </span>
      </div>
    )}
  </motion.div>
)

// ── VideoPanel ────────────────────────────────────────────────────────────────
const VideoPanel = ({ users }: { users: typeof MOCK_ROOM.users }) => {
  const [micOn,  setMicOn]  = useState(true)
  const [camOn,  setCamOn]  = useState(false)
  const [deafOn, setDeafOn] = useState(false)
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25, duration: 0.35 }}
      style={{
        gridArea:      'video',
        background:    'var(--color-surface)',
        borderLeft:    '1px solid rgba(255,255,255,0.05)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding:      '7px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display:      'flex',
        alignItems:   'center',
        gap:          6,
        flexShrink:   0,
      }}>
        <VideoIcon />
        <span style={{
          fontFamily:    'Inter, sans-serif',
          fontSize:      11,
          fontWeight:    600,
          color:         'var(--color-text-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Room
        </span>
        <span style={{
          marginLeft:   'auto',
          fontFamily:   'Inter, sans-serif',
          fontSize:     10,
          color:        'var(--color-success)',
          background:   'rgba(52,211,153,0.1)',
          borderRadius: 4,
          padding:      '1px 6px',
        }}>
          {users.filter(u => u.active).length} online
        </span>
      </div>

      {/* Tiles */}
      <div style={{
        flex:          1,
        overflow:      'auto',
        padding:       8,
        display:       'flex',
        flexDirection: 'column',
        gap:           6,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.05) transparent',
      }}>
        {users.map((u, i) => (
          <VideoTile key={u.id} user={u} index={i} />
        ))}
      </div>

      {/* Controls */}
      <div style={{
        padding:        '8px 10px',
        borderTop:      '1px solid rgba(255,255,255,0.05)',
        display:        'flex',
        justifyContent: 'center',
        gap:            6,
        flexShrink:     0,
      }}>
        <MediaBtn onClick={() => setMicOn(v => !v)} active={micOn} title={micOn ? 'Mute' : 'Unmute'} danger={!micOn}>
          {micOn ? <MicOnIcon /> : <MicOffIcon />}
        </MediaBtn>
        <MediaBtn onClick={() => setCamOn(v => !v)} active={camOn} title={camOn ? 'Camera off' : 'Camera on'}>
          <CamIcon />
        </MediaBtn>
        <MediaBtn onClick={() => setDeafOn(v => !v)} active={!deafOn} title={deafOn ? 'Undeafen' : 'Deafen'}>
          <HeadphonesIcon />
        </MediaBtn>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />
        <MediaBtn onClick={() => navigate('/')} active={false} title="Leave room" danger>
          <LeaveIcon />
        </MediaBtn>
      </div>
    </motion.div>
  )
}

const MediaBtn = ({
  onClick, active, title, danger, children,
}: {
  onClick: () => void
  active: boolean
  title: string
  danger?: boolean
  children: React.ReactNode
}) => (
  <motion.button
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    title={title}
    style={{
      width:          32,
      height:         32,
      borderRadius:   8,
      background:     danger ? 'rgba(248,113,113,0.1)' : active ? 'var(--color-accent-dim)' : 'var(--color-elevated)',
      border:         `1px solid ${danger ? 'rgba(248,113,113,0.25)' : active ? 'rgba(124,111,247,0.25)' : 'rgba(255,255,255,0.06)'}`,
      color:          danger ? 'var(--color-danger)' : active ? 'var(--color-accent)' : 'var(--color-text-muted)',
      cursor:         'pointer',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      transition:     'background 0.15s, color 0.15s',
    }}
  >
    {children}
  </motion.button>
)

// ── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = ({
  room, language, onLanguageChange, isRunning, onRun,
}: {
  room: typeof MOCK_ROOM
  language: string
  onLanguageChange: (l: string) => void
  isRunning: boolean
  onRun: () => void
}) => {
  const [langOpen, setLangOpen] = useState(false)
  const [copied,   setCopied]   = useState(false)
  const navigate = useNavigate()

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        gridArea:     'topbar',
        height:       44,
        background:   'var(--color-surface)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display:      'flex',
        alignItems:   'center',
        padding:      '0 14px',
        gap:          10,
        userSelect:   'none',
        flexShrink:   0,
        zIndex:       20,
      }}
    >
      {/* Logo */}
      <motion.button
        whileHover={{ opacity: 0.7 }}
        onClick={() => navigate('/')}
        style={{
          fontFamily:    "'Syne', sans-serif",
          fontWeight:    800,
          fontSize:      15,
          color:         'var(--color-accent)',
          letterSpacing: '-0.5px',
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          padding:       0,
        }}
      >
        Depot
      </motion.button>

      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.07)' }} />

      {/* Room name */}
      <span style={{
        fontFamily:    "'Syne', sans-serif",
        fontWeight:    600,
        fontSize:      13,
        color:         'var(--color-text-primary)',
        letterSpacing: '-0.2px',
      }}>
        {room.name}
      </span>

      {/* Language selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setLangOpen(v => !v)}
          style={{
            fontFamily:   "'JetBrains Mono', monospace",
            fontSize:     11,
            color:        'var(--color-text-secondary)',
            background:   'var(--color-elevated)',
            border:       '1px solid rgba(255,255,255,0.07)',
            borderRadius: 5,
            padding:      '3px 8px',
            cursor:       'pointer',
            display:      'flex',
            alignItems:   'center',
            gap:          5,
          }}
        >
          {language}
          <span style={{ fontSize: 9, opacity: 0.5 }}>▾</span>
        </button>

        <AnimatePresence>
          {langOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              style={{
                position:     'absolute',
                top:          '110%',
                left:         0,
                background:   'var(--color-elevated)',
                border:       '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                overflow:     'hidden',
                zIndex:       100,
                minWidth:     130,
                boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  onClick={() => { onLanguageChange(l); setLangOpen(false) }}
                  style={{
                    display:    'block',
                    width:      '100%',
                    padding:    '7px 12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize:   11,
                    color:      l === language ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    background: l === language ? 'var(--color-accent-dim)' : 'transparent',
                    border:     'none',
                    cursor:     'pointer',
                    textAlign:  'left',
                  }}
                  onMouseEnter={e => { if (l !== language) (e.currentTarget as HTMLElement).style.background = 'var(--color-hover)' }}
                  onMouseLeave={e => { if (l !== language) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {l}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ flex: 1 }} />

      {/* Presence */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {room.users.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.07, type: 'spring', stiffness: 300 }}
            title={u.name}
            style={{
              width:          28,
              height:         28,
              borderRadius:   '50%',
              background:     u.color + '1a',
              border:         `1.5px solid ${u.active ? u.color : u.color + '44'}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       11,
              fontFamily:     'Inter, sans-serif',
              fontWeight:     600,
              color:          u.active ? u.color : u.color + '55',
              cursor:         'default',
              marginLeft:     i === 0 ? 8 : -6,
              zIndex:         room.users.length - i,
              position:       'relative',
            }}
          >
            {u.avatar}
            {u.active && (
              <span style={{
                position:     'absolute',
                bottom:       0,
                right:        0,
                width:        7,
                height:       7,
                borderRadius: '50%',
                background:   'var(--color-success)',
                border:       '1.5px solid var(--color-surface)',
              }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Share */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleCopy}
        style={{
          fontFamily:   'Inter, sans-serif',
          fontSize:     12,
          fontWeight:   500,
          color:        copied ? 'var(--color-success)' : 'var(--color-text-secondary)',
          background:   'var(--color-elevated)',
          border:       '1px solid rgba(255,255,255,0.07)',
          borderRadius: 6,
          padding:      '5px 11px',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          5,
          transition:   'color 0.2s',
        }}
      >
        {copied ? <><CheckIcon /> Copied</> : <><LinkIcon /> Share</>}
      </motion.button>

      {/* Run / Stop */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRun}
        style={{
          fontFamily:   'Inter, sans-serif',
          fontSize:     12,
          fontWeight:   600,
          color:        '#fff',
          background:   isRunning ? 'rgba(248,113,113,0.18)' : 'var(--color-accent)',
          border:       isRunning ? '1px solid rgba(248,113,113,0.35)' : '1px solid transparent',
          borderRadius: 6,
          padding:      '5px 14px',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          5,
          transition:   'background 0.2s',
        }}
      >
        {isRunning ? <><StopIcon /> Stop</> : <><RunIcon /> Run</>}
      </motion.button>
    </motion.div>
  )
}

// ── Status bar ────────────────────────────────────────────────────────────────
const StatusBar = ({
  room, language, lineCount, cursorPos,
}: {
  room: typeof MOCK_ROOM
  language: string
  lineCount: number
  cursorPos: { line: number; col: number }
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
    style={{
      gridArea:   'statusbar',
      height:     30,
      background: 'var(--color-accent)',
      display:    'flex',
      alignItems: 'center',
      padding:    '0 12px',
      gap:        12,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize:   11,
      color:      'rgba(255,255,255,0.8)',
      flexShrink: 0,
      userSelect: 'none',
    }}
  >
    <span style={{ color: '#fff', fontWeight: 700 }}>⬡ Depot</span>
    <Sep /><span>{room.name}</span>
    <Sep /><span>{language}</span>
    <Sep /><span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
    <Sep /><span>{lineCount} lines</span>
    <div style={{ flex: 1 }} />
    <span style={{ opacity: 0.6 }}>{room.users.filter(u => u.active).length} online</span>
    <Sep /><span style={{ opacity: 0.6 }}>UTF-8</span>
    <Sep /><span style={{ opacity: 0.6 }}>Yjs synced</span>
  </motion.div>
)

const Sep = () => <span style={{ opacity: 0.3 }}>│</span>

// ── EditorPage ────────────────────────────────────────────────────────────────
const EditorPage = () => {
  const { roomId } = useParams<{ roomId: string }>()

  const [code,          setCode]          = useState(MOCK_CODE)
  const [note,          setNote]          = useState(MOCK_NOTE)
  const [language,      setLanguage]      = useState(MOCK_ROOM.language)
  const [isRunning,     setIsRunning]     = useState(false)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [cursorPos,     setCursorPos]     = useState({ line: 1, col: 1 })
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const handleEditorMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    editor.onDidChangeCursorPosition(e => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column })
    })
  }, [])

  const handleRun = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
      setTerminalLines(prev => [
        ...prev,
        { type: 'info', text: 'Process terminated.', timestamp: Date.now() },
      ])
      return
    }
    setIsRunning(true)
    setTerminalLines([
      { type: 'cmd',  text: `run ${language.toLowerCase()}`, timestamp: Date.now() },
      { type: 'info', text: 'Compiling...', timestamp: Date.now() },
    ])
    setTimeout(() => {
      setTerminalLines(prev => [
        ...prev,
        { type: 'out',  text: '✓ Compiled successfully', timestamp: Date.now() },
        { type: 'out',  text: 'Output: { status: 200, data: "ok" }', timestamp: Date.now() },
        { type: 'info', text: '✓ Done (exit 0, 1.4s)', timestamp: Date.now() },
      ])
      setIsRunning(false)
    }, 2400)
  }, [isRunning, language])

  return (
    <div
      style={{
        width:    '100vw',
        height:   '100vh',
        background: 'var(--color-app)',
        display:  'grid',
        gridTemplateAreas: `
          "topbar    topbar    topbar"
          "notepad   editor    video"
          "notepad   terminal  video"
          "statusbar statusbar statusbar"
        `,
        gridTemplateColumns: '220px 1fr 190px',
        gridTemplateRows:    '44px 1fr 140px 30px',
        overflow: 'hidden',
      }}
    >
      <Topbar
        room={MOCK_ROOM}
        language={language}
        onLanguageChange={setLanguage}
        isRunning={isRunning}
        onRun={handleRun}
      />

      <Notepad
        value={note}
        onChange={setNote}
        activeUsers={MOCK_ROOM.users.filter(u => u.active && u.id !== '1')}
      />

      <Editor
        value={code}
        onChange={setCode}
        language={language}
        remoteCursors={MOCK_REMOTE_CURSORS}
        onMount={handleEditorMount}
      />

      <Terminal
        lines={terminalLines}
        isRunning={isRunning}
        activeUsers={MOCK_ROOM.users.filter(u => u.active)}
        language={language}
        onCommand={cmd => console.log('[cmd]', cmd)}
      />

      <VideoPanel users={MOCK_ROOM.users} />

      <StatusBar
        room={MOCK_ROOM}
        language={language}
        lineCount={code.split('\n').length}
        cursorPos={cursorPos}
      />
    </div>
  )
}

export default EditorPage

// ── Icons ─────────────────────────────────────────────────────────────────────
const RunIcon = () => (<svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2l7 4-7 4V2z"/></svg>)
const StopIcon = () => (<svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="8" height="8" rx="1"/></svg>)
const LinkIcon = () => (<svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5.5 8.5l3-3M8 4h2a2 2 0 010 4H9M6 10H4a2 2 0 010-4h1" strokeLinecap="round"/></svg>)
const CheckIcon = () => (<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>)
const VideoIcon = () => (<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}><rect x="1" y="3" width="9" height="8" rx="1.5"/><path d="M10 5.5l3-2v7l-3-2V5.5z"/></svg>)
const MicOnIcon = () => (<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="1" width="4" height="7" rx="2"/><path d="M2 7a5 5 0 0010 0M7 12v2" strokeLinecap="round"/></svg>)
const MicOffIcon = () => (<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="1" width="4" height="7" rx="2"/><path d="M2 7a5 5 0 0010 0M7 12v2M2 2l10 10" strokeLinecap="round"/></svg>)
const CamIcon = () => (<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="9" height="8" rx="1.5"/><path d="M10 5.5l3-2v7l-3-2V5.5z"/></svg>)
const HeadphonesIcon = () => (<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8V7a5 5 0 0110 0v1" strokeLinecap="round"/><rect x="1" y="8" width="3" height="4" rx="1"/><rect x="10" y="8" width="3" height="4" rx="1"/></svg>)
const LeaveIcon = () => (<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 7h7M9 5l2 2-2 2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 3H3a1 1 0 00-1 1v6a1 1 0 001 1h5" strokeLinecap="round"/></svg>)