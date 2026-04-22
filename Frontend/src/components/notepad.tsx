// Notepad.tsx — Collaborative Notes with Public / Private modes
// Public  → real-time broadcast via socket to everyone in the room
// Private → local only, saved to DB per user (no one else sees it)

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSocket } from '../lib/socket'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface NotepadProps {
  roomId: string
  userId: string
  userName: string
  userColor: string
  /** private note value (from DB / parent) */
  privateValue?: string
  onPrivateChange?: (v: string) => void
  activeUsers?: { id: string; name: string; color: string }[]
}

// ── Simple markdown renderer ──────────────────────────────────────────────────
const renderMarkdown = (md: string): string =>
  md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/_(.+?)_/g,       '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/(<li>.+<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .split(/\n\n+/)
    .map(b => /^<(h[1-3]|ul|ol|blockquote|hr)/.test(b.trim()) ? b : `<p>${b.replace(/\n/g,'<br/>')}</p>`)
    .join('\n')

type Mode = 'public' | 'private'

// ── Main component ────────────────────────────────────────────────────────────
const Notepad = ({
  roomId,
  userId,
  userName,
  userColor,
  privateValue = '',
  onPrivateChange,
  activeUsers = [],
}: NotepadProps) => {
  const [mode, setMode]           = useState<Mode>('public')
  const [preview, setPreview]     = useState(false)

  // Public note state (driven by socket)
  const [pubContent,     setPubContent]     = useState('')
  const [pubAuthorName,  setPubAuthorName]  = useState('')
  const [pubAuthorColor, setPubAuthorColor] = useState('#7c6ff7')
  const [pubUpdatedAt,   setPubUpdatedAt]   = useState('')
  const [pubTyping,      setPubTyping]      = useState(false) // remote is typing

  // Local edit buffer for public (to avoid re-renders blocking input)
  const [pubEdit, setPubEdit] = useState('')
  const pubEditRef = useRef(pubEdit)
  pubEditRef.current = pubEdit

  // Private note state
  const [privEdit, setPrivEdit] = useState(privateValue)
  useEffect(() => { setPrivEdit(privateValue) }, [privateValue])

  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const broadcastTimer = useRef<ReturnType<typeof setTimeout>>()
  const typingTimer    = useRef<ReturnType<typeof setTimeout>>()

  // ── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return
    const socket = getSocket()

    // Join notes channel & get current snapshot
    socket.emit('notes:join', { roomId })

    socket.on('notes:public:snapshot', (data: {
      content: string; authorName: string; authorColor: string; updatedAt: string
    }) => {
      setPubContent(data.content)
      setPubAuthorName(data.authorName)
      setPubAuthorColor(data.authorColor)
      setPubUpdatedAt(data.updatedAt)
      // Only sync edit buffer if this user isn't currently editing
      setPubEdit(prev => prev === pubEditRef.current ? data.content : prev)
    })

    socket.on('notes:public:update', (data: {
      content: string; authorName: string; authorColor: string; updatedAt: string
    }) => {
      setPubContent(data.content)
      setPubAuthorName(data.authorName)
      setPubAuthorColor(data.authorColor)
      setPubUpdatedAt(data.updatedAt)
      setPubTyping(true)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => setPubTyping(false), 1500)
      // If local user isn't the author, sync their edit buffer too
      if (data.authorName !== userName) {
        setPubEdit(data.content)
      }
    })

    return () => {
      socket.off('notes:public:snapshot')
      socket.off('notes:public:update')
    }
  }, [roomId, userName])

  // ── Broadcast public note change ─────────────────────────────────────────────
  const broadcastPublic = useCallback((content: string) => {
    clearTimeout(broadcastTimer.current)
    broadcastTimer.current = setTimeout(() => {
      const socket = getSocket()
      socket.emit('notes:public:update', {
        roomId,
        content,
        authorName:  userName,
        authorColor: userColor,
      })
    }, 200)
  }, [roomId, userName, userColor])

  const handlePubChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setPubEdit(v)
    broadcastPublic(v)
  }, [broadcastPublic])

  const handlePrivChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setPrivEdit(v)
    onPrivateChange?.(v)
  }, [onPrivateChange])

  const currentVal = mode === 'public' ? pubEdit : privEdit

  // ── Format time ─────────────────────────────────────────────────────────────
  const fmtTime = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // ── Sync pubEdit when switching TO public mode ───────────────────────────────
  useEffect(() => {
    if (mode === 'public') setPubEdit(pubContent)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: 'var(--color-surface)',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '8px 10px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <NoteIcon />
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: 12, color: 'var(--color-text-secondary)',
            letterSpacing: '-0.2px',
          }}>
            Notes
          </span>
          <div style={{ flex: 1 }} />
          {/* Preview toggle */}
          <button
            onClick={() => setPreview(p => !p)}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600,
              padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: preview ? 'var(--color-accent-dim)' : 'var(--color-elevated)',
              color: preview ? 'var(--color-accent)' : 'var(--color-text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {/* Public / Private pill toggle */}
        <div style={{
          display: 'flex', background: 'var(--color-elevated)',
          borderRadius: 8, padding: 3, gap: 2,
        }}>
          {(['public', 'private'] as Mode[]).map(m => (
            <motion.button
              key={m}
              onClick={() => setMode(m)}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, fontFamily: 'Inter, sans-serif',
                fontSize: 11, fontWeight: 600,
                padding: '5px 0', borderRadius: 6, border: 'none',
                cursor: 'pointer',
                background: mode === m
                  ? m === 'public' ? 'var(--color-accent)' : 'rgba(251,113,133,0.15)'
                  : 'transparent',
                color: mode === m
                  ? m === 'public' ? '#fff' : '#fb7185'
                  : 'var(--color-text-muted)',
                transition: 'all 0.18s ease',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 5,
              }}
            >
              {m === 'public' ? <GlobeIcon /> : <LockIcon />}
              {m === 'public' ? 'Public' : 'Private'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Mode description banner ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            padding: '5px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            flexShrink: 0,
            background: mode === 'public'
              ? 'rgba(124,111,247,0.06)'
              : 'rgba(251,113,133,0.05)',
          }}
        >
          {mode === 'public' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 10,
                color: 'var(--color-accent-light)',
              }}>
                🌐 Shared with everyone in this room
              </span>
              {pubTyping && pubAuthorName && pubAuthorName !== userName && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 10,
                    color: pubAuthorColor, marginLeft: 'auto',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}
                >
                  <TypingDots color={pubAuthorColor} />
                  {pubAuthorName} typing…
                </motion.span>
              )}
              {pubAuthorName && !pubTyping && pubUpdatedAt && (
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 10,
                  color: 'var(--color-text-hint)', marginLeft: 'auto',
                }}>
                  by <span style={{ color: pubAuthorColor }}>{pubAuthorName}</span>
                  {' '}· {fmtTime(pubUpdatedAt)}
                </span>
              )}
            </div>
          ) : (
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 10,
              color: '#fb7185',
            }}>
              🔒 Only visible to you — never shared
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{
                width: '100%', height: '100%', overflow: 'auto',
                padding: '12px 14px', boxSizing: 'border-box',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.06) transparent',
              }}
            >
              {currentVal.trim() === '' ? (
                <div style={{
                  fontFamily: "'Manrope', sans-serif", fontSize: 12,
                  color: 'var(--color-text-hint)', fontStyle: 'italic',
                }}>
                  Nothing to preview yet.
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(currentVal) }}
                  style={{ '--md-font': "'Manrope', sans-serif" } as React.CSSProperties}
                />
              )}
            </motion.div>
          ) : (
            <motion.textarea
              key={`edit-${mode}`}
              ref={textareaRef}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              value={currentVal}
              onChange={mode === 'public' ? handlePubChange : handlePrivChange}
              placeholder={
                mode === 'public'
                  ? '## Room Notes\n\nShare ideas, todos, links…\nEveryone can see this!'
                  : '## My Private Notes\n\nOnly you can see this.\nUse markdown formatting.'
              }
              style={{
                width: '100%', height: '100%',
                background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', padding: '12px',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 12.5, lineHeight: 1.75,
                color: 'var(--color-text-secondary)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.06) transparent',
                boxSizing: 'border-box',
                caretColor: mode === 'public' ? 'var(--color-accent)' : '#fb7185',
              }}
              spellCheck={false}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{
        padding: '4px 10px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 10,
          color: 'var(--color-text-hint)',
        }}>
          {currentVal.trim() === '' ? 0 : currentVal.trim().split(/\s+/).length}w
          · {currentVal.length}c
        </span>
        {mode === 'public' && activeUsers.length > 0 && (
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 10,
            color: 'var(--color-text-hint)',
          }}>
            · {activeUsers.length} in room
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600,
          color: mode === 'public' ? 'var(--color-accent)' : '#fb7185',
          padding: '1px 6px',
          background: mode === 'public' ? 'rgba(124,111,247,0.1)' : 'rgba(251,113,133,0.1)',
          borderRadius: 4,
        }}>
          {mode === 'public' ? '🌐 public' : '🔒 private'}
        </span>
      </div>
    </div>
  )
}

export default Notepad

// ── Typing dots animation ─────────────────────────────────────────────────────
const TypingDots = ({ color }: { color: string }) => (
  <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
    {[0, 0.15, 0.3].map((delay, i) => (
      <motion.span
        key={i}
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, delay }}
        style={{
          width: 3, height: 3, borderRadius: '50%',
          background: color, display: 'inline-block',
        }}
      />
    ))}
  </span>
)

// ── Icons ─────────────────────────────────────────────────────────────────────
const NoteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    style={{ color: 'var(--color-text-muted)' }}>
    <rect x="2" y="1" width="10" height="12" rx="1.5" />
    <path d="M5 5h4M5 8h3" strokeLinecap="round" />
  </svg>
)
const GlobeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="5.5" />
    <path d="M7 1.5C7 1.5 5 4 5 7s2 5.5 2 5.5M7 1.5C7 1.5 9 4 9 7s-2 5.5-2 5.5M1.5 7h11"
      strokeLinecap="round" />
  </svg>
)
const LockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2.5" y="6" width="9" height="7" rx="1.5" />
    <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" strokeLinecap="round" />
  </svg>
)

// ── Markdown preview styles ───────────────────────────────────────────────────
const PREVIEW_STYLES = `
  [style*="--md-font"] h1,[style*="--md-font"] h2,[style*="--md-font"] h3{
    font-family:'Syne',sans-serif;color:var(--color-text-primary);
    font-weight:700;margin:12px 0 6px;letter-spacing:-0.3px}
  [style*="--md-font"] h1{font-size:16px}
  [style*="--md-font"] h2{font-size:14px}
  [style*="--md-font"] h3{font-size:13px}
  [style*="--md-font"] p{
    font-family:'Manrope',sans-serif;font-size:12px;
    line-height:1.75;color:var(--color-text-secondary);margin:4px 0}
  [style*="--md-font"] strong{color:var(--color-text-primary);font-weight:700}
  [style*="--md-font"] em{color:var(--color-accent-light);font-style:italic}
  [style*="--md-font"] code{
    font-family:'JetBrains Mono',monospace;font-size:11px;
    background:var(--color-elevated);color:var(--color-accent-light);
    padding:1px 5px;border-radius:3px}
  [style*="--md-font"] blockquote{
    border-left:2px solid var(--color-accent);margin:6px 0;
    padding:2px 10px;color:var(--color-text-muted);
    font-style:italic;font-family:'Manrope',sans-serif;font-size:12px}
  [style*="--md-font"] ul{padding-left:16px;margin:4px 0}
  [style*="--md-font"] li{
    font-family:'Manrope',sans-serif;font-size:12px;
    color:var(--color-text-secondary);line-height:1.75}
  [style*="--md-font"] a{color:var(--color-accent-light);text-decoration:underline;text-underline-offset:2px}
  [style*="--md-font"] hr{border:none;border-top:1px solid rgba(255,255,255,0.07);margin:10px 0}
  [style*="--md-font"] del{color:var(--color-text-hint);text-decoration:line-through}
`
if (typeof document !== 'undefined' && !document.getElementById('notepad-md-styles')) {
  const s = document.createElement('style')
  s.id = 'notepad-md-styles'
  s.textContent = PREVIEW_STYLES
  document.head.appendChild(s)
}