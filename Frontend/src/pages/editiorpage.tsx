// editorpage.tsx — fully responsive, all components wired
// Fonts: Syne (logo/room name) | Inter (UI chrome) | JetBrains (code/terminal/lang)

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import * as monaco from 'monaco-editor'

import Editor from '../components/editior'
import type { RemoteCursor } from '../components/editior'
import Terminal from '../components/terminal'
import type { TerminalLine } from '../components/terminal'
import Notepad from '../components/notepad'
import { Sidebar } from '../components/sidebar'
import { Presence } from '../components/sidebar'
import { VideoPanel } from '../components/VideoPanel'
import ShareButton from '../components/sharebutton'
import LanguageSelector from '../components/languageselectors'
import Tooltip from '../components/tooltip'
import LoadingScreen from '../components/loadingscreen'
import { ConfirmModal } from '../components/modal'

/* ── Mock data ────────────────────────────────────────────── */
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

const MOCK_PARTICIPANTS = [
  { id: '1', name: 'Varun',  colorIdx: 0, speaking: true,  muted: false, camOff: true,  isLocal: true  },
  { id: '2', name: 'Shreya', colorIdx: 1, speaking: false, muted: false, camOff: true,  isLocal: false },
  { id: '3', name: 'Dev',    colorIdx: 2, speaking: false, muted: true,  camOff: true,  isLocal: false },
]

/* ── Icon helpers ─────────────────────────────────────────── */
const RunIcon  = () => <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2l7 4-7 4V2z"/></svg>
const StopIcon = () => <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="8" height="8" rx="1"/></svg>
const NotesIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 3h9M2 6.5h9M2 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
const VideoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="3" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M9 5.5l3-1.5v5l-3-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const Sep = () => (
  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', userSelect: 'none' }}>│</span>
)

/* ── Topbar ───────────────────────────────────────────────── */
interface TopbarProps {
  room:             typeof MOCK_ROOM
  language:         string
  onLanguageChange: (l: string) => void
  isRunning:        boolean
  onRun:            () => void
  notesOpen:        boolean
  videoOpen:        boolean
  onToggleNotes:    () => void
  onToggleVideo:    () => void
  isMobile:         boolean
}

function Topbar({
  room, language, onLanguageChange,
  isRunning, onRun,
  notesOpen, videoOpen, onToggleNotes, onToggleVideo,
  isMobile,
}: TopbarProps) {
  const navigate = useNavigate()

  const presenceUsers = room.users.map(u => ({
    id:      u.id,
    name:    u.name,
    editing: u.active && u.id !== '1',
    color:   u.color,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ duration: 0.25 }}
      style={{
        gridArea:     'topbar',
        height:       44,
        background:   'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display:      'flex',
        alignItems:   'center',
        padding:      '0 12px',
        gap:          8,
        userSelect:   'none',
        flexShrink:   0,
        zIndex:       20,
        overflowX:    'auto',
      }}
    >
      {/* Logo — font: Syne */}
      <motion.button
        whileHover={{ opacity: 0.7 }}
        onClick={() => navigate('/')}
        style={{
          fontFamily:    'var(--font-heading)',
          fontWeight:    800,
          fontSize:      '0.9rem',
          color:         'var(--color-accent)',
          letterSpacing: '-0.03em',
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          padding:       0,
          flexShrink:    0,
        }}
      >
        Depot
      </motion.button>

      <div style={{ width: 1, height: 16, background: 'var(--color-border-md)', flexShrink: 0 }}/>

      {/* Room name — font: Syne */}
      <span style={{
        fontFamily:    'var(--font-heading)',
        fontWeight:    600,
        fontSize:      '0.825rem',
        color:         'var(--color-text-primary)',
        letterSpacing: '-0.01em',
        flexShrink:    0,
        maxWidth:      isMobile ? 80 : 160,
        overflow:      'hidden',
        textOverflow:  'ellipsis',
        whiteSpace:    'nowrap',
      }}>
        {room.name}
      </span>

      {/* Language selector — font: JetBrains Mono (inside component) */}
      <LanguageSelector
        value={language}
        onChange={onLanguageChange}
      />

      <div style={{ flex: 1 }}/>

      {/* Panel toggles (mobile) */}
      {isMobile && (
        <>
          <Tooltip content="Notes" side="bottom">
            <motion.button
              onClick={onToggleNotes}
              whileTap={{ scale: 0.9 }}
              style={{
                background:   notesOpen ? 'var(--color-accent-dim)' : 'transparent',
                border:       `1px solid ${notesOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                color:        notesOpen ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                padding:      '5px 7px',
                cursor:       'pointer',
                display:      'flex',
              }}
            >
              <NotesIcon />
            </motion.button>
          </Tooltip>
          <Tooltip content="Video" side="bottom">
            <motion.button
              onClick={onToggleVideo}
              whileTap={{ scale: 0.9 }}
              style={{
                background:   videoOpen ? 'var(--color-accent-dim)' : 'transparent',
                border:       `1px solid ${videoOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                color:        videoOpen ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                padding:      '5px 7px',
                cursor:       'pointer',
                display:      'flex',
              }}
            >
              <VideoIcon />
            </motion.button>
          </Tooltip>
        </>
      )}

      {/* Presence — hidden on mobile */}
      {!isMobile && (
        <Presence users={presenceUsers} max={4} />
      )}

      {/* Share */}
      <ShareButton roomId={room.id} compact={isMobile} />

      {/* Run / Stop */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRun}
        style={{
          fontFamily:   'var(--font-ui)',
          fontSize:     '0.775rem',
          fontWeight:   600,
          color:        isRunning ? 'var(--color-danger)' : '#fff',
          background:   isRunning ? 'var(--color-danger-dim)' : 'var(--color-accent)',
          border:       isRunning ? '1px solid rgba(248,113,113,0.3)' : '1px solid transparent',
          borderRadius: 'var(--radius-sm)',
          padding:      '5px 12px',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          5,
          flexShrink:   0,
          transition:   'all 150ms ease',
        }}
      >
        {isRunning ? <><StopIcon /> Stop</> : <><RunIcon /> {isMobile ? '' : 'Run'}</>}
      </motion.button>
    </motion.div>
  )
}

/* ── Status bar ───────────────────────────────────────────── */
function StatusBar({
  room, language, lineCount, cursorPos, isMobile,
}: {
  room: typeof MOCK_ROOM
  language: string
  lineCount: number
  cursorPos: { line: number; col: number }
  isMobile: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      style={{
        gridArea:   'statusbar',
        height:     30,
        background: 'var(--color-accent)',
        display:    'flex',
        alignItems: 'center',
        padding:    '0 10px',
        gap:        10,
        fontFamily: 'var(--font-code)',    /* JetBrains Mono */
        fontSize:   '0.675rem',
        color:      'rgba(255,255,255,0.82)',
        flexShrink: 0,
        userSelect: 'none',
        overflowX:  'auto',
      }}
    >
      {/* font: Syne — brand mark */}
      <span style={{
        fontFamily:    'var(--font-heading)',
        fontWeight:    800,
        fontSize:      '0.75rem',
        color:         '#fff',
        letterSpacing: '-0.02em',
        flexShrink:    0,
      }}>
        Depot
      </span>

      <Sep />
      <span style={{ flexShrink: 0 }}>{room.name}</span>
      <Sep />
      {/* font: JetBrains Mono — language, line/col */}
      <span style={{ flexShrink: 0 }}>{language}</span>
      <Sep />
      <span style={{ flexShrink: 0 }}>Ln {cursorPos.line}, Col {cursorPos.col}</span>

      {!isMobile && (
        <>
          <Sep />
          <span style={{ flexShrink: 0 }}>{lineCount} lines</span>
        </>
      )}

      <div style={{ flex: 1 }}/>

      <span style={{ opacity: 0.7, flexShrink: 0 }}>
        {room.users.filter(u => u.active).length} online
      </span>
      {!isMobile && (
        <>
          <Sep />
          <span style={{ opacity: 0.6, flexShrink: 0 }}>UTF-8</span>
          <Sep />
          <span style={{ opacity: 0.6, flexShrink: 0 }}>Yjs synced</span>
        </>
      )}
    </motion.div>
  )
}

/* ── EditorPage ───────────────────────────────────────────── */
export default function EditorPage() {
  const { roomId }   = useParams<{ roomId: string }>()
  const navigate     = useNavigate()

  const [code,          setCode]          = useState(MOCK_CODE)
  const [note,          setNote]          = useState(MOCK_NOTE)
  const [language,      setLanguage]      = useState(MOCK_ROOM.language)
  const [isRunning,     setIsRunning]     = useState(false)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [cursorPos,     setCursorPos]     = useState({ line: 1, col: 1 })
  const [loading,       setLoading]       = useState(true)
  const [leaveOpen,     setLeaveOpen]     = useState(false)

  // Media state
  const [micOn,   setMicOn]   = useState(true)
  const [camOn,   setCamOn]   = useState(false)
  const [audioOn, setAudioOn] = useState(true)

  // Responsive state
  const [isMobile,   setIsMobile]   = useState(false)
  const [isTablet,   setIsTablet]   = useState(false)
  const [notesOpen,  setNotesOpen]  = useState(false)
  const [videoOpen,  setVideoOpen]  = useState(false)

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  // Responsive breakpoints
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      setIsMobile(w < 600)
      setIsTablet(w >= 600 && w < 900)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Simulate room join loading
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

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
      { type: 'info', text: 'Compiling…',                   timestamp: Date.now() },
    ])
    setTimeout(() => {
      setTerminalLines(prev => [
        ...prev,
        { type: 'out',  text: '✓ Compiled successfully',              timestamp: Date.now() },
        { type: 'out',  text: 'Output: { status: 200, data: "ok" }',  timestamp: Date.now() },
        { type: 'info', text: '✓ Done (exit 0, 1.4s)',                timestamp: Date.now() },
      ])
      setIsRunning(false)
    }, 2400)
  }, [isRunning, language])

  // ── Grid layout ─────────────────────────────────────────
  const gridAreas = isMobile
    ? `"topbar" "editor" "terminal" "statusbar"`
    : isTablet
    ? `"topbar topbar" "editor video" "terminal video" "statusbar statusbar"`
    : `"topbar topbar topbar" "notepad editor video" "notepad terminal video" "statusbar statusbar statusbar"`

  const gridColumns = isMobile
    ? '1fr'
    : isTablet
    ? '1fr 180px'
    : '220px 1fr 190px'

  const gridRows = isMobile
    ? '44px 1fr 160px 30px'
    : '44px 1fr 140px 30px'

  if (loading) {
    return <LoadingScreen message="Joining room…" />
  }

  return (
    <>
      <div
        style={{
          width:               '100vw',
          height:              '100vh',
          background:          'var(--color-app)',
          display:             'grid',
          gridTemplateAreas:   gridAreas,
          gridTemplateColumns: gridColumns,
          gridTemplateRows:    gridRows,
          overflow:            'hidden',
          gap:                 '1px',
          backgroundColor:     'var(--color-border)',
        }}
      >
        {/* ── Topbar ── */}
        <Topbar
          room={MOCK_ROOM}
          language={language}
          onLanguageChange={setLanguage}
          isRunning={isRunning}
          onRun={handleRun}
          notesOpen={notesOpen}
          videoOpen={videoOpen}
          onToggleNotes={() => setNotesOpen(o => !o)}
          onToggleVideo={() => setVideoOpen(o => !o)}
          isMobile={isMobile}
        />

        {/* ── Notes panel — hidden on mobile/tablet unless toggled ── */}
        {!isMobile && !isTablet && (
          <div style={{ gridArea: 'notepad', background: 'var(--color-surface)', overflow: 'hidden' }}>
            <Sidebar title="Notes" badge="synced" badgeOk>
              <Notepad
                value={note}
                onChange={setNote}
                activeUsers={MOCK_ROOM.users.filter(u => u.active && u.id !== '1')}
              />
            </Sidebar>
          </div>
        )}

        {/* ── Editor ── */}
        <div style={{ gridArea: 'editor', background: '#0f0f14', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Editor
            value={code}
            onChange={setCode}
            language={language}
            remoteCursors={MOCK_REMOTE_CURSORS}
            onMount={handleEditorMount}
          />
        </div>

        {/* ── Terminal ── */}
        <div style={{ gridArea: 'terminal', background: '#090910', overflow: 'hidden' }}>
          <Terminal
            lines={terminalLines}
            isRunning={isRunning}
            activeUsers={MOCK_ROOM.users.filter(u => u.active)}
            language={language}
            onCommand={cmd => console.log('[cmd]', cmd)}
          />
        </div>

        {/* ── Video panel — hidden on mobile ── */}
        {!isMobile && (
          <div style={{ gridArea: 'video', background: 'var(--color-surface)', overflow: 'hidden' }}>
            <VideoPanel
              participants={MOCK_PARTICIPANTS}
              micOn={micOn}
              camOn={camOn}
              audioOn={audioOn}
              onMicToggle={() => setMicOn(v => !v)}
              onCamToggle={() => setCamOn(v => !v)}
              onAudioToggle={() => setAudioOn(v => !v)}
              onLeave={() => setLeaveOpen(true)}
            />
          </div>
        )}

        {/* ── Status bar ── */}
        <StatusBar
          room={MOCK_ROOM}
          language={language}
          lineCount={code.split('\n').length}
          cursorPos={cursorPos}
          isMobile={isMobile}
        />
      </div>

      {/* ── Mobile: Notes drawer ── */}
      <AnimatePresence>
        {isMobile && notesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotesOpen(false)}
              style={{
                position:   'fixed',
                inset:      0,
                background: 'rgba(0,0,0,0.5)',
                zIndex:     60,
              }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position:      'fixed',
                top:           44,
                left:          0,
                bottom:        30,
                width:         '80vw',
                maxWidth:      280,
                background:    'var(--color-surface)',
                borderRight:   '1px solid var(--color-border-md)',
                zIndex:        61,
                display:       'flex',
                flexDirection: 'column',
                overflow:      'hidden',
              }}
            >
              <Sidebar title="Notes" badge="synced" badgeOk>
                <Notepad
                  value={note}
                  onChange={setNote}
                  activeUsers={MOCK_ROOM.users.filter(u => u.active && u.id !== '1')}
                />
              </Sidebar>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile: Video drawer ── */}
      <AnimatePresence>
        {isMobile && videoOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoOpen(false)}
              style={{
                position:   'fixed',
                inset:      0,
                background: 'rgba(0,0,0,0.5)',
                zIndex:     60,
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position:      'fixed',
                top:           44,
                right:         0,
                bottom:        30,
                width:         '75vw',
                maxWidth:      240,
                background:    'var(--color-surface)',
                borderLeft:    '1px solid var(--color-border-md)',
                zIndex:        61,
                overflow:      'hidden',
              }}
            >
              <VideoPanel
                participants={MOCK_PARTICIPANTS}
                micOn={micOn}
                camOn={camOn}
                audioOn={audioOn}
                onMicToggle={() => setMicOn(v => !v)}
                onCamToggle={() => setCamOn(v => !v)}
                onAudioToggle={() => setAudioOn(v => !v)}
                onLeave={() => { setVideoOpen(false); setLeaveOpen(true) }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Leave room confirm ── */}
      <ConfirmModal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => navigate('/')}
        title="Leave room?"
        message="You'll be disconnected from the session. Others can continue without you."
        confirmLabel="Leave room"
        danger
      />
    </>
  )
}