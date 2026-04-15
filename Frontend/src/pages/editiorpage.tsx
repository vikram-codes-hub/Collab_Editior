
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'

import Editor          from '../components/editior'
import Terminal        from '../components/terminal'
import Notepad         from '../components/notepad'
import { Sidebar }     from '../components/sidebar'
import { Presence }    from '../components/sidebar'
import { VideoPanel }  from '../components/VideoPanel'
import ShareButton     from '../components/sharebutton'
import LanguageSelector from '../components/languageselectors'
import Tooltip         from '../components/tooltip'
import LoadingScreen   from '../components/loadingscreen'
import { ConfirmModal } from '../components/modal'


import { useRoom }          from '../hooks/useRoom'
import { useEditor }        from '../hooks/useEditor'
import { useTerminal }      from '../hooks/useTerminal'
import { useCollaboration } from '../hooks/useCollaboration'
import useAuthStore         from '../store/authstore'
import useUIStore           from '../store/uiStore'
import { PRESENCE_COLORS }  from '../lib/constants'

const RunIcon   = () => <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2l7 4-7 4V2z"/></svg>
const StopIcon  = () => <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="8" height="8" rx="1"/></svg>
const NotesIcon = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M2 6.5h9M2 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const VideoIcon = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M9 5.5l3-1.5v5l-3-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const Sep       = () => <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', userSelect: 'none' }}>│</span>


function Topbar({
  roomName, roomId, language, onLanguageChange,
  isRunning, onRun,
  notesOpen, videoOpen, onToggleNotes, onToggleVideo,
  isMobile, onlineUsers,
}: {
  roomName: string; roomId: string
  language: string; onLanguageChange: (l: string) => void
  isRunning: boolean; onRun: () => void
  notesOpen: boolean; videoOpen: boolean
  onToggleNotes: () => void; onToggleVideo: () => void
  isMobile: boolean
  onlineUsers: { id: string; name: string; color: string }[]
}) {
  const navigate = useNavigate()

  // Build presence users for Presence component
  const { user } = useAuthStore()
  const presenceUsers = onlineUsers.map((u, i) => ({
    id:      u.id,
    name:    u.name,
    editing: true,
    color:   u.color ?? PRESENCE_COLORS[i % PRESENCE_COLORS.length],
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ duration: 0.25 }}
      style={{
        gridArea: 'topbar', height: 44,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 8,
        userSelect: 'none', flexShrink: 0, zIndex: 20, overflowX: 'auto',
      }}
    >
      {/* Logo — font: Syne */}
      <motion.button
        whileHover={{ opacity: 0.7 }}
        onClick={() => navigate('/home')}
        style={{
          fontFamily: 'var(--font-heading)', fontWeight: 800,
          fontSize: '0.9rem', color: 'var(--color-accent)',
          letterSpacing: '-0.03em', background: 'none',
          border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        }}
      >
        Depot
      </motion.button>

      <div style={{ width: 1, height: 16, background: 'var(--color-border-md)', flexShrink: 0 }}/>

      {/* Room name — font: Syne */}
      <span style={{
        fontFamily: 'var(--font-heading)', fontWeight: 600,
        fontSize: '0.825rem', color: 'var(--color-text-primary)',
        letterSpacing: '-0.01em', flexShrink: 0,
        maxWidth: isMobile ? 80 : 160,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {roomName}
      </span>

      {/* Language selector */}
      <LanguageSelector value={language} onChange={onLanguageChange} />

      <div style={{ flex: 1 }}/>

      {/* Mobile panel toggles */}
      {isMobile && (
        <>
          <Tooltip content="Notes" side="bottom">
            <motion.button onClick={onToggleNotes} whileTap={{ scale: 0.9 }}
              style={{
                background: notesOpen ? 'var(--color-accent-dim)' : 'transparent',
                border: `1px solid ${notesOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: notesOpen ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                padding: '5px 7px', cursor: 'pointer', display: 'flex',
              }}>
              <NotesIcon />
            </motion.button>
          </Tooltip>
          <Tooltip content="Video" side="bottom">
            <motion.button onClick={onToggleVideo} whileTap={{ scale: 0.9 }}
              style={{
                background: videoOpen ? 'var(--color-accent-dim)' : 'transparent',
                border: `1px solid ${videoOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: videoOpen ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                padding: '5px 7px', cursor: 'pointer', display: 'flex',
              }}>
              <VideoIcon />
            </motion.button>
          </Tooltip>
        </>
      )}

      {/* Presence — real online users */}
      {!isMobile && presenceUsers.length > 0 && (
        <Presence users={presenceUsers} max={4} />
      )}

      {/* Share */}
      <ShareButton roomId={roomId} compact={isMobile} />

      {/* Run / Stop */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={onRun}
        style={{
          fontFamily: 'var(--font-ui)', fontSize: '0.775rem', fontWeight: 600,
          color: isRunning ? 'var(--color-danger)' : '#fff',
          background: isRunning ? 'var(--color-danger-dim)' : 'var(--color-accent)',
          border: isRunning ? '1px solid rgba(248,113,113,0.3)' : '1px solid transparent',
          borderRadius: 'var(--radius-sm)', padding: '5px 12px',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: 5, flexShrink: 0, transition: 'all 150ms ease',
        }}
      >
        {isRunning ? <><StopIcon /> Stop</> : <><RunIcon />{isMobile ? '' : ' Run'}</>}
      </motion.button>
    </motion.div>
  )
}

/* ── Status bar ───────────────────────────────────────────── */
function StatusBar({
  roomName, language, lineCount, cursorPos, isMobile, onlineCount, yjsConnected,
}: {
  roomName: string; language: string
  lineCount: number; cursorPos: { line: number; col: number }
  isMobile: boolean; onlineCount: number; yjsConnected: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      style={{
        gridArea: 'statusbar', height: 30,
        background: 'var(--color-accent)',
        display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 10,
        fontFamily: 'var(--font-code)',
        fontSize: '0.675rem', color: 'rgba(255,255,255,0.82)',
        flexShrink: 0, userSelect: 'none', overflowX: 'auto',
      }}
    >
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.75rem', color: '#fff', letterSpacing: '-0.02em', flexShrink: 0 }}>
        Depot
      </span>
      <Sep /><span style={{ flexShrink: 0 }}>{roomName}</span>
      <Sep /><span style={{ flexShrink: 0 }}>{language}</span>
      <Sep /><span style={{ flexShrink: 0 }}>Ln {cursorPos.line}, Col {cursorPos.col}</span>
      {!isMobile && <><Sep /><span style={{ flexShrink: 0 }}>{lineCount} lines</span></>}
      <div style={{ flex: 1 }}/>
      <span style={{ opacity: 0.7, flexShrink: 0 }}>{onlineCount} online</span>
      {!isMobile && (
        <>
          <Sep /><span style={{ opacity: 0.6, flexShrink: 0 }}>UTF-8</span>
          <Sep /><span style={{ opacity: 0.6, flexShrink: 0 }}>{yjsConnected ? 'Yjs synced' : 'connecting…'}</span>
        </>
      )}
    </motion.div>
  )
}

/* ── EditorPage ───────────────────────────────────────────── */
export default function EditorPage() {
  const { roomId = '' } = useParams<{ roomId: string }>()
  const navigate        = useNavigate()
  const { user }        = useAuthStore()

  // ── UI state ────────────────────────────────────────────
  const {
    isMobile, isTablet,
    notesOpen, videoOpen,
    leaveRoomOpen,
    setIsMobile, setIsTablet,
    toggleNotes, toggleVideo,
    openLeaveRoom, closeLeaveRoom,
  } = useUIStore()

  // ── Media state ──────────────────────────────────────────
  const [micOn,   setMicOn]   = useState(true)
  const [camOn,   setCamOn]   = useState(false)
  const [audioOn, setAudioOn] = useState(true)

  // ── Note state ───────────────────────────────────────────
  const [note, setNote] = useState('')

  // ── Real hooks ───────────────────────────────────────────
  const { currentRoom, onlineUsers, handleLeave } = useRoom(roomId)

  const {
    code, language, cursorPos, isRunning,
    editorOptions, onMount, runCode, stopCode,
    changeLanguage, setCode, clearTerminal, lineCount,
  } = useEditor(roomId)

  const { terminalLines, isRunning: termRunning } = useTerminal(roomId)

  const colorIdx = onlineUsers.findIndex(u => u.userId === user?.id)
  const { bindEditor, remoteCursors, yjsConnected } = useCollaboration(
    roomId,
    colorIdx >= 0 ? colorIdx : 0
  )

  // ── Responsive ───────────────────────────────────────────
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

  // ── Build participants for VideoPanel ────────────────────
  const participants = [
    // Local user first
    {
      id:      user?.id ?? 'local',
      name:    user?.username ?? 'You',
      colorIdx: colorIdx >= 0 ? colorIdx : 0,
      isLocal:  true,
      camOff:   !camOn,
      muted:    !micOn,
      speaking: false,
    },
    // Remote users
    ...onlineUsers
      .filter(u => u.userId !== user?.id)
      .map((u, i) => ({
        id:       u.socketId,
        name:     u.username,
        colorIdx: i + 1,
        isLocal:  false,
        camOff:   true,
        muted:    false,
        speaking: false,
      })),
  ]

  // ── Notepad active users ─────────────────────────────────
  const noteActiveUsers = onlineUsers
    .filter(u => u.userId !== user?.id)
    .map((u, i) => ({
      id:    u.userId,
      name:  u.username,
      color: u.color ?? PRESENCE_COLORS[i % PRESENCE_COLORS.length],
    }))

  // ── Grid layout ──────────────────────────────────────────
  const gridAreas = isMobile
    ? `"topbar" "editor" "terminal" "statusbar"`
    : isTablet
    ? `"topbar topbar" "editor video" "terminal video" "statusbar statusbar"`
    : `"topbar topbar topbar" "notepad editor video" "notepad terminal video" "statusbar statusbar statusbar"`

  const gridColumns = isMobile ? '1fr' : isTablet ? '1fr 180px' : '220px 1fr 190px'
  const gridRows    = isMobile ? '44px 1fr 160px 30px' : '44px 1fr 140px 30px'

  if (!currentRoom && !roomId) {
    return <LoadingScreen message="Joining room…" />
  }

  return (
    <>
      <div style={{
        width: '100vw', height: '100vh',
        background: 'var(--color-app)',
        display: 'grid',
        gridTemplateAreas:   gridAreas,
        gridTemplateColumns: gridColumns,
        gridTemplateRows:    gridRows,
        overflow: 'hidden', gap: '1px',
        backgroundColor: 'var(--color-border)',
      }}>

        {/* ── Topbar ── */}
        <Topbar
          roomName={currentRoom?.name ?? roomId}
          roomId={roomId}
          language={language}
          onLanguageChange={changeLanguage}
          isRunning={isRunning || termRunning}
          onRun={isRunning ? stopCode : runCode}
          notesOpen={notesOpen}
          videoOpen={videoOpen}
          onToggleNotes={toggleNotes}
          onToggleVideo={toggleVideo}
          isMobile={isMobile}
          onlineUsers={onlineUsers.map((u, i) => ({
            id:    u.userId,
            name:  u.username,
            color: u.color ?? PRESENCE_COLORS[i % PRESENCE_COLORS.length],
          }))}
        />

        {/* ── Notes panel ── */}
        {!isMobile && !isTablet && (
          <div style={{ gridArea: 'notepad', background: 'var(--color-surface)', overflow: 'hidden' }}>
            <Sidebar title="Notes" badge="private" badgeOk={true}>
              <Notepad
                value={note}
                onChange={setNote}
              />
            </Sidebar>
          </div>
        )}

        {/* ── Editor — wired to useCollaboration ── */}
        <div style={{ gridArea: 'editor', background: '#0f0f14', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Editor
            value={code}
            onChange={setCode}
            language={language}
            remoteCursors={remoteCursors}
            onMount={(editor) => {
              onMount(editor)      // cursor tracking
              bindEditor(editor)   // Yjs binding
            }}
          />
        </div>

        {/* ── Terminal — wired to useTerminal ── */}
        <div style={{ gridArea: 'terminal', background: '#090910', overflow: 'hidden' }}>
          <Terminal
            lines={terminalLines}
            isRunning={isRunning || termRunning}
            activeUsers={onlineUsers.map((u, i) => ({
              id:    u.userId,
              name:  u.username,
              color: u.color ?? PRESENCE_COLORS[i % PRESENCE_COLORS.length],
            }))}
            language={language}
            onCommand={(cmd) => {
              if (cmd === 'clear') { clearTerminal(); return }
              runCode()
            }}
          />
        </div>

        {/* ── Video panel ── */}
        {!isMobile && (
          <div style={{ gridArea: 'video', background: 'var(--color-surface)', overflow: 'hidden' }}>
            <VideoPanel
              participants={participants}
              micOn={micOn}
              camOn={camOn}
              audioOn={audioOn}
              onMicToggle={() => setMicOn(v => !v)}
              onCamToggle={() => setCamOn(v => !v)}
              onAudioToggle={() => setAudioOn(v => !v)}
              onLeave={openLeaveRoom}
            />
          </div>
        )}

        {/* ── Status bar ── */}
        <StatusBar
          roomName={currentRoom?.name ?? roomId}
          language={language}
          lineCount={lineCount}
          cursorPos={cursorPos}
          isMobile={isMobile}
          onlineCount={onlineUsers.length}
          yjsConnected={yjsConnected}
        />
      </div>

      {/* ── Mobile: Notes drawer ── */}
      <AnimatePresence>
        {isMobile && notesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleNotes}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed', top: 44, left: 0, bottom: 30,
                width: '80vw', maxWidth: 280,
                background: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border-md)',
                zIndex: 61, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
              <Sidebar title="Notes" badge="private" badgeOk={true}>
                <Notepad value={note} onChange={setNote} />
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleVideo}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed', top: 44, right: 0, bottom: 30,
                width: '75vw', maxWidth: 240,
                background: 'var(--color-surface)',
                borderLeft: '1px solid var(--color-border-md)',
                zIndex: 61, overflow: 'hidden',
              }}
            >
              <VideoPanel
                participants={participants}
                micOn={micOn} camOn={camOn} audioOn={audioOn}
                onMicToggle={() => setMicOn(v => !v)}
                onCamToggle={() => setCamOn(v => !v)}
                onAudioToggle={() => setAudioOn(v => !v)}
                onLeave={() => { toggleVideo(); openLeaveRoom() }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Leave room confirm ── */}
      <ConfirmModal
        open={leaveRoomOpen}
        onClose={closeLeaveRoom}
        onConfirm={handleLeave}
        title="Leave room?"
        message="You'll be disconnected from the session. Others can continue without you."
        confirmLabel="Leave room"
        danger
      />
    </>
  )
}