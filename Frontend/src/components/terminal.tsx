// Terminal.tsx
// Phase 4 — Shared terminal panel
// Fonts: JetBrains Mono (all terminal text) | Inter (panel chrome/labels)
// xterm.js for real terminal rendering

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

//Types
export interface TerminalLine {
  type: 'cmd' | 'out' | 'err' | 'info' | 'warn'
  text: string
  userId?: string
  userName?: string
  userColor?: string
  timestamp?: number
}

export interface TerminalProps {
  lines?: TerminalLine[]
  isRunning?: boolean
  activeUsers?: { id: string; name: string; color: string }[]
  onCommand?: (cmd: string) => void
  language?: string
}

//xterm theme
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

// ── ANSI color helpers
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

//Welcome banner
const BANNER = [
  `${ansi.violet}${ansi.bold}  ╭─────────────────────────────────╮${ansi.reset}`,
  `${ansi.violet}${ansi.bold}  │  ${ansi.white}ctx${ansi.violet} · shared terminal          │${ansi.reset}`,
  `${ansi.violet}${ansi.bold}  │  ${ansi.muted}output broadcast to all users  ${ansi.violet}│${ansi.reset}`,
  `${ansi.violet}${ansi.bold}  ╰─────────────────────────────────╯${ansi.reset}`,
  '',
]

const PROMPT = `${ansi.violet}❯${ansi.reset} `

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Terminal component ────────────────────────────────────────────────────────
const Terminal = ({
  lines = [],
  isRunning = false,
  activeUsers = [],
  onCommand,
  language = 'TypeScript',
}: TerminalProps) => {
  const containerRef    = useRef<HTMLDivElement>(null)
  const xtermRef        = useRef<XTerm | null>(null)
  const fitAddonRef     = useRef<FitAddon | null>(null)
  const inputRef        = useRef('')
  const historyRef      = useRef<string[]>([])
  const histIdxRef      = useRef(-1)
  const lastLineCountRef = useRef(0)          // ← tracks how many lines already written
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [height, setHeight]           = useState(140)
  const isDragging  = useRef(false)
  const dragStartY  = useRef(0)
  const dragStartH  = useRef(0)

  // ── Init xterm ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const xterm = new XTerm({
      theme:             XTERM_THEME,
      fontFamily:        "'JetBrains Mono', monospace",
      fontSize:          12,
      lineHeight:        1.55,
      letterSpacing:     0.3,
      cursorBlink:       true,
      cursorStyle:       'bar',
      scrollback:        2000,
      convertEol:        true,
      allowTransparency: true,
      rows:              8,
    })

    const fitAddon      = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    xterm.open(containerRef.current)

    setTimeout(() => {
      fitAddon.fit()
      BANNER.forEach(line => xterm.writeln(line))
      xterm.write(PROMPT)
    }, 60)

    xtermRef.current    = xterm
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
          lastLineCountRef.current = 0
          historyRef.current.unshift(cmd)
          histIdxRef.current = -1
          xterm.write(PROMPT)
          return
        }

        if (cmd.trim()) {
          historyRef.current.unshift(cmd)
          histIdxRef.current = -1
          // ← Tell parent (EditorPage) to run code via socket
          onCommand?.(cmd)
          xterm.write(`${ansi.muted}[running…]${ansi.reset}\r\n`)
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
        lastLineCountRef.current = 0
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

  // ── Write NEW lines from socket into xterm ───────────────────────────────
  // FIX: only write lines that haven't been written yet, using lastLineCountRef
  useEffect(() => {
    const xterm = xtermRef.current
    if (!xterm) return

    const newLines = lines.slice(lastLineCountRef.current)
    if (newLines.length === 0) return

    lastLineCountRef.current = lines.length

    newLines.forEach(line => {
      const prefix = line.userName
        ? `${colorFromHex(line.userColor ?? '#9d9ab8')}[${line.userName}]${ansi.reset} `
        : ''

      const color = line.type === 'err'  ? ansi.red
                  : line.type === 'cmd'  ? ansi.violet
                  : line.type === 'info' ? ansi.yellow
                  : line.type === 'warn' ? ansi.orange
                  : ansi.white   // 'out' — actual program output should be bright white

      xterm.writeln(`${prefix}${color}${line.text}${ansi.reset}`)
    })

    // After output is done (not running), show prompt again
    if (!isRunning) {
      xterm.write(PROMPT)
    }
  }, [lines])

  // ── Also show prompt when run finishes ───────────────────────────────────
  useEffect(() => {
    const xterm = xtermRef.current
    if (!xterm || isRunning) return
    // isRunning just flipped to false — prompt already written above
    // but if lines didn't change, write prompt here
  }, [isRunning])

  // ── Reset lastLineCountRef when terminal is cleared ───────────────────────
  useEffect(() => {
    if (lines.length === 0) {
      lastLineCountRef.current = 0
      const xterm = xtermRef.current
      if (xterm) {
        xterm.clear()
        xterm.write(PROMPT)
      }
    }
  }, [lines.length])

  // ── Fit on resize ────────────────────────────────────────────────────────
  useEffect(() => {
    const ro = new ResizeObserver(() => fitAddonRef.current?.fit())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Drag to resize ───────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartH.current = height

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
        gridArea:      'terminal',
        background:    '#090910',
        borderTop:     '1px solid rgba(255,255,255,0.05)',
        display:       'flex',
        flexDirection: 'column',
        height:        isPanelOpen ? height : 32,
        overflow:      'hidden',
        transition:    'height 0.2s ease',
        position:      'relative',
        userSelect:    isDragging.current ? 'none' : 'auto',
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{
          position:   'absolute',
          top:        0, left: 0, right: 0,
          height:     4,
          cursor:     'ns-resize',
          zIndex:     10,
          background: 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,111,247,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />

      {/* Panel header */}
      <div style={{
        height:       32,
        minHeight:    32,
        padding:      '0 12px',
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        borderBottom: isPanelOpen ? '1px solid rgba(255,255,255,0.04)' : 'none',
        cursor:       'default',
      }}>
        {/* Traffic light dots */}
        <div style={{ display: 'flex', gap: 5, marginRight: 2 }}>
          {['#f87171', '#fbbf24', '#34d399'].map((c, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: c, opacity: 0.7,
            }} />
          ))}
        </div>

        <span style={{
          fontFamily:    'Inter, sans-serif',
          fontSize:      11,
          fontWeight:    600,
          color:         'var(--color-text-muted)',
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
              fontFamily:   'Inter, sans-serif',
              fontSize:     10,
              color:        'var(--color-warning)',
              background:   'rgba(251,191,36,0.1)',
              borderRadius: 4,
              padding:      '1px 6px',
            }}
          >
            running
          </motion.span>
        )}

        <div style={{ flex: 1 }} />

        {activeUsers.length > 0 && (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        4,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   10,
            color:      'var(--color-text-hint)',
          }}>
            <BroadcastIcon />
            {activeUsers.length} watching
          </div>
        )}

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
              flex:     1,
              overflow: 'hidden',
              padding:  '4px 4px 4px 8px',
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