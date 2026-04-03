// Terminal.tsx
// Phase 4 — Shared terminal panel
// Fonts: JetBrains Mono (all terminal text) | Inter (panel chrome/labels)
// xterm.js for real terminal rendering
// Socket.io broadcast: all users see same output in real time (Phase 6 wiring at bottom)

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TerminalLine {
  type: 'cmd' | 'out' | 'err' | 'info'
  text: string
  userId?: string
  userName?: string
  userColor?: string
  timestamp?: number
}

export interface TerminalProps {
  lines?: TerminalLine[]
  isRunning?: boolean
  /** Who is currently in the room (for broadcast label) */
  activeUsers?: { id: string; name: string; color: string }[]
  /** Called when user submits a command */
  onCommand?: (cmd: string) => void
  /** Language for the run hint */
  language?: string
}

// ── xterm theme aligned to design system ─────────────────────────────────────
const XTERM_THEME = {
  background:    '#090910',
  foreground:    '#9d9ab8',
  cursor:        '#7c6ff7',
  cursorAccent:  '#0f0f14',
  selectionBackground: 'rgba(124,111,247,0.25)',
  black:         '#13131a',
  red:           '#f87171',
  green:         '#34d399',
  yellow:        '#fbbf24',
  blue:          '#60a5fa',
  magenta:       '#a78bfa',
  cyan:          '#34d399',
  white:         '#9d9ab8',
  brightBlack:   '#3b3950',
  brightRed:     '#f87171',
  brightGreen:   '#34d399',
  brightYellow:  '#fbbf24',
  brightBlue:    '#60a5fa',
  brightMagenta: '#c4b5fd',
  brightCyan:    '#6ee7b7',
  brightWhite:   '#eeeeff',
}

// ── ANSI color helpers ────────────────────────────────────────────────────────
const ansi = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  violet:  '\x1b[38;2;124;111;247m',
  green:   '\x1b[38;2;52;211;153m',
  red:     '\x1b[38;2;248;113;113m',
  yellow:  '\x1b[38;2;251;191;36m',
  muted:   '\x1b[38;2;102;99;127m',
  white:   '\x1b[38;2;238;238;255m',
  orange:  '\x1b[38;2;251;146;60m',
}

const colorFromHex = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `\x1b[38;2;${r};${g};${b}m`
}

// ── Welcome banner ────────────────────────────────────────────────────────────
const BANNER = [
  `${ansi.violet}${ansi.bold}  ╭─────────────────────────────────╮${ansi.reset}`,
  `${ansi.violet}${ansi.bold}  │  ${ansi.white}ctx${ansi.violet} · shared terminal          │${ansi.reset}`,
  `${ansi.violet}${ansi.bold}  │  ${ansi.muted}output broadcast to all users  ${ansi.violet}│${ansi.reset}`,
  `${ansi.violet}${ansi.bold}  ╰─────────────────────────────────╯${ansi.reset}`,
  '',
]

// ── Prompt string ─────────────────────────────────────────────────────────────
const PROMPT = `${ansi.violet}❯${ansi.reset} `

// ── Mock command runner (Phase 6: replace with Socket.io emit) ────────────────
const runMockCommand = async (
  cmd: string,
  language: string,
  write: (text: string) => void,
): Promise<void> => {
  const trimmed = cmd.trim()
  if (!trimmed) return

  write(`\r\n${ansi.muted}[running]${ansi.reset}\r\n`)

  await delay(180)

  if (trimmed === 'clear' || trimmed === 'cls') {
    return // handled by caller
  }

  if (trimmed.startsWith('echo ')) {
    write(`${ansi.white}${trimmed.slice(5)}${ansi.reset}\r\n`)
    return
  }

  if (trimmed === 'help') {
    write([
      `${ansi.violet}Available commands:${ansi.reset}`,
      `  ${ansi.green}run${ansi.reset}       ${ansi.muted}— execute current editor code${ansi.reset}`,
      `  ${ansi.green}clear${ansi.reset}     ${ansi.muted}— clear terminal${ansi.reset}`,
      `  ${ansi.green}echo <msg>${ansi.reset} ${ansi.muted}— print message${ansi.reset}`,
      `  ${ansi.green}who${ansi.reset}       ${ansi.muted}— list room members${ansi.reset}`,
      '',
    ].join('\r\n'))
    return
  }

  if (trimmed === 'run') {
    write(`${ansi.muted}$ npx ts-node editor.ts${ansi.reset}\r\n`)
    await delay(300)
    write(`${ansi.yellow}Compiling ${language}...${ansi.reset}\r\n`)
    await delay(600)
    write(`${ansi.green}✓ Compiled successfully${ansi.reset}\r\n`)
    await delay(200)
    write(`${ansi.white}Output: { status: 200, data: "ok" }${ansi.reset}\r\n`)
    write(`${ansi.muted}──────────────────────────────────${ansi.reset}\r\n`)
    write(`${ansi.green}✓ Done${ansi.reset} ${ansi.muted}(exit 0, 1.2s)${ansi.reset}\r\n`)
    return
  }

  if (trimmed === 'who') {
    write(`${ansi.violet}Room members:${ansi.reset}\r\n`)
    write(`  ${ansi.green}● Varun${ansi.reset}  ${ansi.muted}(you)${ansi.reset}\r\n`)
    write(`  ${ansi.orange}● Shreya${ansi.reset}\r\n`)
    write(`  ${ansi.muted}○ Dev    (offline)${ansi.reset}\r\n`)
    return
  }

  // Unknown command
  write(`${ansi.red}command not found:${ansi.reset} ${ansi.white}${trimmed}${ansi.reset}\r\n`)
  write(`${ansi.muted}type ${ansi.reset}help${ansi.muted} for available commands${ansi.reset}\r\n`)
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Terminal component ────────────────────────────────────────────────────────
const Terminal = ({
  lines = [],
  isRunning = false,
  activeUsers = [],
  onCommand,
  language = 'TypeScript',
}: TerminalProps) => {
  const containerRef  = useRef<HTMLDivElement>(null)
  const xtermRef      = useRef<XTerm | null>(null)
  const fitAddonRef   = useRef<FitAddon | null>(null)
  const inputRef      = useRef('')
  const historyRef    = useRef<string[]>([])
  const histIdxRef    = useRef(-1)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [height, setHeight]           = useState(140)
  const isDragging    = useRef(false)
  const dragStartY    = useRef(0)
  const dragStartH    = useRef(0)

  // ── Init xterm ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const xterm = new XTerm({
      theme:           XTERM_THEME,
      fontFamily:      "'JetBrains Mono', monospace", // JetBrains Mono — terminal
      fontSize:        12,
      lineHeight:      1.55,
      letterSpacing:   0.3,
      cursorBlink:     true,
      cursorStyle:     'bar',
      scrollback:      2000,
      convertEol:      true,
      allowTransparency: true,
      rows:            8,
    })

    const fitAddon      = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    xterm.open(containerRef.current)

    // Small delay so DOM is laid out
    setTimeout(() => {
      fitAddon.fit()
      BANNER.forEach(line => xterm.writeln(line))
      xterm.write(PROMPT)
    }, 60)

    xtermRef.current   = xterm
    fitAddonRef.current = fitAddon

    // ── Key handler ───────────────────────────────────────────────────────
    xterm.onKey(({ key, domEvent }) => {
      const ev = domEvent
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey

      if (ev.key === 'Enter') {
        const cmd = inputRef.current
        xterm.write('\r\n')

        if (cmd.trim() === 'clear' || cmd.trim() === 'cls') {
          xterm.clear()
          inputRef.current = ''
          historyRef.current.unshift(cmd)
          histIdxRef.current = -1
          xterm.write(PROMPT)
          return
        }

        if (cmd.trim()) {
          historyRef.current.unshift(cmd)
          histIdxRef.current = -1
          onCommand?.(cmd)
          runMockCommand(cmd, language, text => xterm.write(text)).then(() => {
            xterm.write(PROMPT)
          })
        } else {
          xterm.write(PROMPT)
        }
        inputRef.current = ''

      } else if (ev.key === 'Backspace') {
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1)
          xterm.write('\b \b')
        }

      } else if (ev.key === 'ArrowUp') {
        if (historyRef.current.length === 0) return
        histIdxRef.current = Math.min(histIdxRef.current + 1, historyRef.current.length - 1)
        const prev = historyRef.current[histIdxRef.current]
        clearLine(xterm, inputRef.current)
        inputRef.current = prev
        xterm.write(prev)

      } else if (ev.key === 'ArrowDown') {
        if (histIdxRef.current <= 0) {
          histIdxRef.current = -1
          clearLine(xterm, inputRef.current)
          inputRef.current = ''
          return
        }
        histIdxRef.current--
        const next = historyRef.current[histIdxRef.current]
        clearLine(xterm, inputRef.current)
        inputRef.current = next
        xterm.write(next)

      } else if (ev.ctrlKey && ev.key === 'c') {
        xterm.write('^C\r\n')
        inputRef.current = ''
        histIdxRef.current = -1
        xterm.write(PROMPT)

      } else if (ev.ctrlKey && ev.key === 'l') {
        xterm.clear()
        inputRef.current = ''
        xterm.write(PROMPT)

      } else if (printable) {
        inputRef.current += key
        xterm.write(key)
      }
    })

    return () => {
      xterm.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pipe in external lines (Socket.io broadcast, Phase 6) ───────────────
  useEffect(() => {
    const xterm = xtermRef.current
    if (!xterm || lines.length === 0) return
    const last = lines[lines.length - 1]
    if (!last) return

    const prefix = last.userName
      ? `${colorFromHex(last.userColor ?? '#9d9ab8')}[${last.userName}]${ansi.reset} `
      : ''

    const color = last.type === 'err'  ? ansi.red
                : last.type === 'cmd'  ? ansi.violet
                : last.type === 'info' ? ansi.yellow
                : ansi.muted

    xterm.writeln(`${prefix}${color}${last.text}${ansi.reset}`)
  }, [lines])

  // ── Fit on resize ────────────────────────────────────────────────────────
  useEffect(() => {
    const ro = new ResizeObserver(() => fitAddonRef.current?.fit())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Drag to resize ───────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current  = true
    dragStartY.current  = e.clientY
    dragStartH.current  = height

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const delta = dragStartY.current - ev.clientY
      setHeight(Math.max(80, Math.min(360, dragStartH.current + delta)))
    }
    const onUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setTimeout(() => fitAddonRef.current?.fit(), 50)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [height])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      style={{
        gridArea:  'terminal',
        background: '#090910',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display:   'flex',
        flexDirection: 'column',
        height:    isPanelOpen ? height : 32,
        overflow:  'hidden',
        transition: 'height 0.2s ease',
        position:  'relative',
        userSelect: isDragging.current ? 'none' : 'auto',
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{
          position:  'absolute',
          top:       0,
          left:      0,
          right:     0,
          height:    4,
          cursor:    'ns-resize',
          zIndex:    10,
          background: 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,111,247,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />

      {/* Panel header */}
      <div style={{
        height:     32,
        minHeight:  32,
        padding:    '0 12px',
        display:    'flex',
        alignItems: 'center',
        gap:        8,
        borderBottom: isPanelOpen ? '1px solid rgba(255,255,255,0.04)' : 'none',
        cursor:     'default',
      }}>
        {/* Dots */}
        <div style={{ display: 'flex', gap: 5, marginRight: 2 }}>
          {['#f87171', '#fbbf24', '#34d399'].map((c, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: c, opacity: 0.7,
            }} />
          ))}
        </div>

        <span style={{
          fontFamily: 'Inter, sans-serif', // Inter — label
          fontSize:   11,
          fontWeight: 600,
          color:      'var(--color-text-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Terminal
        </span>

        {isRunning && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize:   10,
              color:      'var(--color-warning)',
              background: 'rgba(251,191,36,0.1)',
              borderRadius: 4,
              padding:    '1px 6px',
            }}
          >
            running
          </motion.span>
        )}

        <div style={{ flex: 1 }} />

        {/* Active users broadcast label */}
        {activeUsers.length > 0 && (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        4,
            fontFamily: "'JetBrains Mono', monospace", // JetBrains Mono
            fontSize:   10,
            color:      'var(--color-text-hint)',
          }}>
            <BroadcastIcon />
            {activeUsers.length} watching
          </div>
        )}

        {/* Collapse toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsPanelOpen(v => !v)}
          style={{
            background: 'transparent',
            border:     'none',
            cursor:     'pointer',
            color:      'var(--color-text-hint)',
            padding:    '2px 4px',
            display:    'flex',
            alignItems: 'center',
          }}
        >
          <motion.div
            animate={{ rotate: isPanelOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon />
          </motion.div>
        </motion.button>
      </div>

      {/* xterm container */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            ref={containerRef}
            style={{
              flex:       1,
              overflow:   'hidden',
              padding:    '4px 4px 4px 8px',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Terminal

// ── Helpers ───────────────────────────────────────────────────────────────────
const clearLine = (xterm: XTerm, current: string) => {
  xterm.write('\b \b'.repeat(current.length))
}

// ── Icon components ───────────────────────────────────────────────────────────
const BroadcastIcon = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="2" />
    <path d="M3.5 3.5a5 5 0 017 7M2 2a8 8 0 0110 10" strokeLinecap="round" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ── Socket.io wiring note (Phase 6) ──────────────────────────────────────────
//
// Replace mock runMockCommand with real socket emit:
//
//   import { socket } from '../lib/socket'
//
//   // Send command to server
//   socket.emit('terminal:run', { roomId, command: cmd, language })
//
//   // Receive output broadcast
//   socket.on('terminal:output', ({ text, type, userId, userName, userColor }) => {
//     const xterm = xtermRef.current
//     if (!xterm) return
//     const prefix = userName
//       ? `${colorFromHex(userColor)}[${userName}]${ansi.reset} `
//       : ''
//     xterm.writeln(`${prefix}${text}`)
//   })
//
//   // Cleanup
//   return () => { socket.off('terminal:output') }
//
// ─────────────────────────────────────────────────────────────────────────────