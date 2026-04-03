import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tooltip from './tooltip'

/* ============================================================
   ShareButton
   font: Inter (--font-ui) — button label, copied feedback
   font: JetBrains (--font-code) — room URL display
   Used in: Navbar (top right area of editor page)
   ============================================================ */

const ShareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="10.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="10.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="2.5"  cy="6.5"  r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4 6l5-3M4 7l5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 4V2.5A1.5 1.5 0 006.5 1h-4A1.5 1.5 0 001 2.5v4A1.5 1.5 0 002.5 8H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface ShareButtonProps {
  roomId?:  string
  compact?: boolean   // icon-only mode for narrow navbars
}

export default function ShareButton({ roomId, compact = false }: ShareButtonProps) {
  const [copied,   setCopied]   = useState(false)
  const [expanded, setExpanded] = useState(false)

  const url = roomId
    ? `${window.location.origin}/room/${roomId}`
    : window.location.href

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (compact) {
    return (
      <Tooltip content={copied ? 'Copied!' : 'Share room'} side="bottom">
        <motion.button
          onClick={copy}
          whileHover={{ background: 'var(--color-hover)' }}
          whileTap={{ scale: 0.93 }}
          style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            background:   'transparent',
            border:       '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color:        copied ? 'var(--color-success)' : 'var(--color-text-secondary)',
            padding:      '5px 7px',
            cursor:       'pointer',
            transition:   'all 150ms ease',
          }}
        >
          {copied ? <CheckIcon /> : <ShareIcon />}
        </motion.button>
      </Tooltip>
    )
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Main button — font: Inter */}
      <motion.button
        onClick={() => setExpanded(e => !e)}
        whileHover={{ background: 'var(--color-hover)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          background:   expanded ? 'var(--color-elevated)' : 'transparent',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          color:        'var(--color-text-secondary)',
          padding:      '5px 10px',
          cursor:       'pointer',
          fontFamily:   'var(--font-ui)',     /* Inter */
          fontSize:     '0.775rem',
          fontWeight:   500,
          transition:   'all 150ms ease',
        }}
      >
        <ShareIcon />
        Share
      </motion.button>

      {/* Expanded URL popover */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1,  scale: 1,    y: 0  }}
            exit={{ opacity: 0,    scale: 0.96, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position:     'absolute',
              top:          'calc(100% + 8px)',
              right:        0,
              width:        280,
              background:   'var(--color-elevated)',
              border:       '1px solid var(--color-border-md)',
              borderRadius: 'var(--radius-md)',
              boxShadow:    'var(--shadow-md)',
              zIndex:       150,
              padding:      '12px',
              display:      'flex',
              flexDirection:'column',
              gap:          8,
            }}
          >
            {/* Label — font: Inter */}
            <span style={{
              fontFamily:    'var(--font-ui)',
              fontSize:      '0.7rem',
              fontWeight:    500,
              color:         'var(--color-text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Room link
            </span>

            {/* URL row */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              background:   'var(--color-surface)',
              border:       '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding:      '6px 8px',
            }}>
              {/* font: JetBrains Mono — the URL itself */}
              <span style={{
                fontFamily:   'var(--font-code)',
                fontSize:     '0.7rem',
                color:        'var(--color-text-secondary)',
                flex:         1,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}>
                {url}
              </span>

              {/* Copy button — font: Inter */}
              <motion.button
                onClick={copy}
                whileHover={{ color: copied ? 'var(--color-success)' : 'var(--color-text-primary)' }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  color:      copied ? 'var(--color-success)' : 'var(--color-text-muted)',
                  display:    'flex',
                  padding:    2,
                  transition: 'color 150ms ease',
                  flexShrink: 0,
                }}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </motion.button>
            </div>

            {/* Copied feedback — font: Inter */}
            <AnimatePresence>
              {copied && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1,  y: 0  }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize:   '0.7rem',
                    color:      'var(--color-success)',
                    display:    'flex',
                    alignItems: 'center',
                    gap:        4,
                  }}
                >
                  <CheckIcon /> Copied to clipboard
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}