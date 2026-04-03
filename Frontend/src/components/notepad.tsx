// Notepad.tsx
// Phase 4 — Collaborative notepad panel (left)
// Fonts: Manrope (notes body content) | Inter (panel chrome, labels, buttons) | Syne (panel title)
// Yjs synced rich text — Phase 6 will bind Y.Text
// Supports: markdown preview, formatting toolbar, word count, user attribution

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface NotepadProps {
  value?: string
  onChange?: (value: string) => void
  /** Who else is editing (awareness) */
  activeUsers?: { id: string; name: string; color: string }[]
  readOnly?: boolean
}

// ── Simple markdown → HTML renderer (no deps) ────────────────────────────────
const renderMarkdown = (md: string): string => {
  return md
    // headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    // bold / italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/_(.+?)_/g,       '<em>$1</em>')
    // inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // horizontal rule
    .replace(/^---$/gm, '<hr />')
    // unordered list items
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // ordered list
    .replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>')
    // links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // strikethrough
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // wrap consecutive <li> in <ul>
    .replace(/(<li>.+<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/(<oli>.+<\/oli>\n?)+/g, m => `<ol>${m.replace(/<\/?oli>/g, v => v.replace('oli', 'li'))}</ol>`)
    // paragraphs (blank line separated)
    .split(/\n\n+/)
    .map(block => {
      if (/^<(h[1-3]|ul|ol|blockquote|hr)/.test(block.trim())) return block
      return `<p>${block.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')
}

// ── Formatting actions ────────────────────────────────────────────────────────
type FormatAction = 'bold' | 'italic' | 'code' | 'h2' | 'h3' | 'quote' | 'ul' | 'hr'

const applyFormat = (
  text: string,
  selStart: number,
  selEnd: number,
  action: FormatAction,
): { value: string; start: number; end: number } => {
  const before  = text.slice(0, selStart)
  const sel     = text.slice(selStart, selEnd)
  const after   = text.slice(selEnd)
  const hasSelection = sel.length > 0

  const wrap = (open: string, close: string) => {
    const wrapped = `${open}${hasSelection ? sel : 'text'}${close}`
    return {
      value: before + wrapped + after,
      start: selStart + open.length,
      end:   selStart + open.length + (hasSelection ? sel.length : 4),
    }
  }

  const prefix = (str: string) => {
    const line  = before.includes('\n') ? before.slice(before.lastIndexOf('\n') + 1) : before
    const start = selStart - line.length
    const full  = str + (hasSelection ? sel : 'text')
    return {
      value: text.slice(0, start) + full + after,
      start: start + str.length,
      end:   start + str.length + (hasSelection ? sel.length : 4),
    }
  }

  switch (action) {
    case 'bold':  return wrap('**', '**')
    case 'italic':return wrap('_', '_')
    case 'code':  return wrap('`', '`')
    case 'h2':    return prefix('## ')
    case 'h3':    return prefix('### ')
    case 'quote': return prefix('> ')
    case 'ul':    return prefix('- ')
    case 'hr': {
      const ins = '\n---\n'
      return {
        value: before + ins + after,
        start: selStart + ins.length,
        end:   selStart + ins.length,
      }
    }
  }
}

// ── Toolbar button ────────────────────────────────────────────────────────────
const ToolbarBtn = ({
  onClick,
  title,
  children,
  active,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  active?: boolean
}) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    title={title}
    style={{
      width:      24,
      height:     24,
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: active ? 'var(--color-accent-dim)' : 'transparent',
      border:     active ? '1px solid rgba(124,111,247,0.3)' : '1px solid transparent',
      borderRadius: 4,
      color:      active ? 'var(--color-accent)' : 'var(--color-text-muted)',
      cursor:     'pointer',
      fontFamily: 'Inter, sans-serif', // Inter — toolbar
      fontSize:   11,
      fontWeight: 600,
      transition: 'color 0.15s, background 0.15s',
      flexShrink: 0,
    }}
    onMouseEnter={e => {
      if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'
    }}
    onMouseLeave={e => {
      if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'
    }}
  >
    {children}
  </motion.button>
)

// ── Word / char counter ───────────────────────────────────────────────────────
const countWords = (text: string) =>
  text.trim() === '' ? 0 : text.trim().split(/\s+/).length

// ── Notepad component ─────────────────────────────────────────────────────────
const Notepad = ({
  value = '',
  onChange,
  activeUsers = [],
  readOnly = false,
}: NotepadProps) => {
  const [mode, setMode]             = useState<'edit' | 'preview'>('edit')
  const [localVal, setLocalVal]     = useState(value)
  const [isSynced, setIsSynced]     = useState(true)
  const [showUsers, setShowUsers]   = useState(false)
  const textareaRef                 = useRef<HTMLTextAreaElement>(null)
  const syncTimeoutRef              = useRef<ReturnType<typeof setTimeout>>()

  // Sync external value (Yjs will drive this)
  useEffect(() => {
    setLocalVal(value)
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setLocalVal(v)
    setIsSynced(false)
    clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      onChange?.(v)
      setIsSynced(true)
    }, 300)
  }, [onChange])

  // Format action
  const handleFormat = useCallback((action: FormatAction) => {
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart: ss, selectionEnd: se } = ta
    const result = applyFormat(localVal, ss, se, action)
    setLocalVal(result.value)
    onChange?.(result.value)
    // Restore cursor
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(result.start, result.end)
    })
  }, [localVal, onChange])

  // Tab key → indent
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const ss = ta.selectionStart
      const se = ta.selectionEnd
      const v  = localVal.slice(0, ss) + '  ' + localVal.slice(se)
      setLocalVal(v)
      onChange?.(v)
      requestAnimationFrame(() => {
        ta.selectionStart = ss + 2
        ta.selectionEnd   = ss + 2
      })
    }
  }, [localVal, onChange])

  const words = countWords(localVal)
  const chars = localVal.length

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      style={{
        gridArea:      'notepad',
        background:    'var(--color-surface)',
        borderRight:   '1px solid rgba(255,255,255,0.05)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        minHeight:     0,
      }}
    >
      {/* ── Panel header ──────────────────────────────────────────────── */}
      <div style={{
        padding:      '7px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display:      'flex',
        alignItems:   'center',
        gap:          6,
        flexShrink:   0,
      }}>
        <NoteIcon />
        <span style={{
          fontFamily: "'Syne', sans-serif", // Syne — panel title
          fontWeight: 700,
          fontSize:   12,
          color:      'var(--color-text-secondary)',
          letterSpacing: '-0.2px',
        }}>
          Notes
        </span>

        {/* Sync badge */}
        <motion.span
          animate={{ opacity: isSynced ? 1 : 0.5 }}
          style={{
            fontFamily: 'Inter, sans-serif', // Inter — badge
            fontSize:   10,
            color:      isSynced ? 'var(--color-success)' : 'var(--color-warning)',
            background: isSynced ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
            borderRadius: 4,
            padding:    '1px 6px',
            transition: 'background 0.3s, color 0.3s',
          }}
        >
          {isSynced ? '● synced' : '● syncing'}
        </motion.span>

        <div style={{ flex: 1 }} />

        {/* Active users indicator */}
        {activeUsers.length > 0 && (
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowUsers(true)}
            onMouseLeave={() => setShowUsers(false)}
          >
            <div style={{ display: 'flex', gap: -4 }}>
              {activeUsers.slice(0, 3).map((u, i) => (
                <div
                  key={u.id}
                  style={{
                    width:        18,
                    height:       18,
                    borderRadius: '50%',
                    background:   u.color + '22',
                    border:       `1.5px solid ${u.color}`,
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    fontFamily:   'Inter, sans-serif',
                    fontSize:     9,
                    fontWeight:   700,
                    color:        u.color,
                    marginLeft:   i === 0 ? 0 : -5,
                    zIndex:       activeUsers.length - i,
                  }}
                >
                  {u.name[0]}
                </div>
              ))}
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {showUsers && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position:   'absolute',
                    top:        '120%',
                    right:      0,
                    background: 'var(--color-elevated)',
                    border:     '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 7,
                    padding:    '6px 10px',
                    zIndex:     50,
                    minWidth:   100,
                    boxShadow:  '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  {activeUsers.map(u => (
                    <div key={u.id} style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        6,
                      padding:    '2px 0',
                      fontFamily: 'Inter, sans-serif',
                      fontSize:   11,
                      color:      'var(--color-text-secondary)',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: u.color,
                      }} />
                      {u.name}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Formatting toolbar ────────────────────────────────────────── */}
      <div style={{
        padding:      '4px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display:      'flex',
        alignItems:   'center',
        gap:          2,
        flexShrink:   0,
        flexWrap:     'wrap',
      }}>
        <ToolbarBtn onClick={() => handleFormat('bold')}   title="Bold (Ctrl+B)"><BoldIcon /></ToolbarBtn>
        <ToolbarBtn onClick={() => handleFormat('italic')} title="Italic (Ctrl+I)"><ItalicIcon /></ToolbarBtn>
        <ToolbarBtn onClick={() => handleFormat('code')}   title="Inline code"><CodeIcon /></ToolbarBtn>

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />

        <ToolbarBtn onClick={() => handleFormat('h2')}    title="Heading 2"><span>H2</span></ToolbarBtn>
        <ToolbarBtn onClick={() => handleFormat('h3')}    title="Heading 3"><span>H3</span></ToolbarBtn>
        <ToolbarBtn onClick={() => handleFormat('quote')} title="Blockquote"><QuoteIcon /></ToolbarBtn>
        <ToolbarBtn onClick={() => handleFormat('ul')}    title="List item"><ListIcon /></ToolbarBtn>
        <ToolbarBtn onClick={() => handleFormat('hr')}    title="Divider"><HrIcon /></ToolbarBtn>

        <div style={{ flex: 1 }} />

        {/* Edit / Preview toggle */}
        <div style={{
          display:      'flex',
          background:   'var(--color-elevated)',
          borderRadius: 5,
          padding:      2,
          gap:          1,
        }}>
          {(['edit', 'preview'] as const).map(m => (
            <motion.button
              key={m}
              onClick={() => setMode(m)}
              style={{
                fontFamily:   'Inter, sans-serif', // Inter — toggle
                fontSize:     10,
                fontWeight:   600,
                padding:      '2px 8px',
                borderRadius: 4,
                border:       'none',
                cursor:       'pointer',
                background:   mode === m ? 'var(--color-hover)' : 'transparent',
                color:        mode === m ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                transition:   'background 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {m}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {mode === 'edit' ? (
            <motion.textarea
              key="edit"
              ref={textareaRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              value={localVal}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              placeholder={"## Sprint Notes\n\n- Todo items here\n- Share ideas\n\n> Use markdown formatting"}
              style={{
                width:       '100%',
                height:      '100%',
                background:  'transparent',
                border:      'none',
                outline:     'none',
                resize:      'none',
                padding:     '12px 12px',
                fontFamily:  "'Manrope', sans-serif", // Manrope — notes body
                fontSize:    12.5,
                lineHeight:  1.75,
                color:       'var(--color-text-secondary)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.06) transparent',
                boxSizing:   'border-box',
                caretColor:  'var(--color-accent)',
              }}
              spellCheck={false}
            />
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{
                width:     '100%',
                height:    '100%',
                overflow:  'auto',
                padding:   '12px 14px',
                boxSizing: 'border-box',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.06) transparent',
              }}
            >
              {localVal.trim() === '' ? (
                <div style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize:   12,
                  color:      'var(--color-text-hint)',
                  fontStyle:  'italic',
                }}>
                  Nothing to preview yet.
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(localVal) }}
                  style={{ '--md-font': "'Manrope', sans-serif" } as React.CSSProperties}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer: word count ────────────────────────────────────────── */}
      <div style={{
        padding:      '4px 12px',
        borderTop:    '1px solid rgba(255,255,255,0.04)',
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        flexShrink:   0,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif', // Inter — meta
          fontSize:   10,
          color:      'var(--color-text-hint)',
        }}>
          {words}w · {chars}c
        </span>
        {activeUsers.length > 0 && (
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize:   10,
            color:      'var(--color-text-hint)',
          }}>
            · {activeUsers.length} editing
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default Notepad

// ── Markdown preview styles (inject once) ────────────────────────────────────
const PREVIEW_STYLES = `
  [style*="--md-font"] h1, [style*="--md-font"] h2, [style*="--md-font"] h3 {
    font-family: 'Syne', sans-serif;
    color: var(--color-text-primary);
    font-weight: 700;
    margin: 12px 0 6px;
    letter-spacing: -0.3px;
  }
  [style*="--md-font"] h1 { font-size: 16px; }
  [style*="--md-font"] h2 { font-size: 14px; }
  [style*="--md-font"] h3 { font-size: 13px; }
  [style*="--md-font"] p {
    font-family: 'Manrope', sans-serif;
    font-size: 12px;
    line-height: 1.75;
    color: var(--color-text-secondary);
    margin: 4px 0;
  }
  [style*="--md-font"] strong {
    color: var(--color-text-primary);
    font-weight: 700;
  }
  [style*="--md-font"] em {
    color: var(--color-accent-light);
    font-style: italic;
  }
  [style*="--md-font"] code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    background: var(--color-elevated);
    color: var(--color-accent-light);
    padding: 1px 5px;
    border-radius: 3px;
  }
  [style*="--md-font"] blockquote {
    border-left: 2px solid var(--color-accent);
    margin: 6px 0;
    padding: 2px 10px;
    color: var(--color-text-muted);
    font-style: italic;
    font-family: 'Manrope', sans-serif;
    font-size: 12px;
  }
  [style*="--md-font"] ul, [style*="--md-font"] ol {
    padding-left: 16px;
    margin: 4px 0;
  }
  [style*="--md-font"] li {
    font-family: 'Manrope', sans-serif;
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.75;
  }
  [style*="--md-font"] a {
    color: var(--color-accent-light);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  [style*="--md-font"] hr {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.07);
    margin: 10px 0;
  }
  [style*="--md-font"] del {
    color: var(--color-text-hint);
    text-decoration: line-through;
  }
`

// Inject preview styles once
if (typeof document !== 'undefined' && !document.getElementById('notepad-md-styles')) {
  const style = document.createElement('style')
  style.id = 'notepad-md-styles'
  style.textContent = PREVIEW_STYLES
  document.head.appendChild(style)
}

// ── Icon components ───────────────────────────────────────────────────────────
const NoteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
    <rect x="2" y="1" width="10" height="12" rx="1.5" />
    <path d="M5 5h4M5 8h3" strokeLinecap="round" />
  </svg>
)
const BoldIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
    <path d="M3 2h4a2.5 2.5 0 010 5H3V2zm0 5h4.5a2.5 2.5 0 010 5H3V7z" />
  </svg>
)
const ItalicIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
    <path d="M7 2h3v1.5H8.4L5.6 8.5H7V10H4V8.5h1.6l2.8-5H7V2z" />
  </svg>
)
const CodeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 4L2 7l3 3M9 4l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const QuoteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
    <path d="M2 4h1.5v3H2V4zm0 4.5h1.5V10H2V8.5zM5 4h1.5v3H5V4zm0 4.5h1.5V10H5V8.5z" opacity="0.7" />
  </svg>
)
const ListIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 4h7M5 7h7M5 10h7" strokeLinecap="round" />
    <circle cx="2.5" cy="4" r="0.8" fill="currentColor" />
    <circle cx="2.5" cy="7" r="0.8" fill="currentColor" />
    <circle cx="2.5" cy="10" r="0.8" fill="currentColor" />
  </svg>
)
const HrIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 7h10" strokeLinecap="round" strokeDasharray="2 1.5" />
  </svg>
)

// ── Yjs wiring note (Phase 6) ─────────────────────────────────────────────────
//
//   import * as Y from 'yjs'
//   import { yCollab } from 'y-codemirror.next' // or manual Y.Text binding
//
//   const ydoc    = useYDoc()        // from context
//   const ytext   = ydoc.getText('notepad')
//
//   // Observe remote changes
//   ytext.observe(() => {
//     onChange?.(ytext.toString())
//   })
//
//   // Apply local change
//   const handleChange = (v: string) => {
//     ydoc.transact(() => {
//       ytext.delete(0, ytext.length)
//       ytext.insert(0, v)
//     })
//   }
//
// ─────────────────────────────────────────────────────────────────────────────