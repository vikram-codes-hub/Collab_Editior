import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from './avatar'
import Badge, { LanguageBadge, UserCountBadge } from './badge'
import Button from './button'
/* ============================================================
   Navbar — font guide:
   Logo/brand  → Syne        (--font-heading)
   All buttons → Inter       (--font-ui)     via Button.tsx
   Language    → JetBrains   (--font-code)   via LanguageBadge
   Room name   → Inter       (--font-ui)
   ============================================================ */

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Rust',
  'Go', 'C++', 'Java', 'HTML', 'CSS', 'JSON', 'Shell',
]

/* ── mock data (swap with store later) ── */
const MOCK_USER = { name: 'Arjun Sharma', email: 'arjun@context.dev' }
const MOCK_ROOM = { name: 'Project Alpha', userCount: 3 }

interface NavbarProps {
  roomName?:    string
  userCount?:   number
  language?:    string
  onRun?:       () => void
  onShare?:     () => void
  onLanguage?:  (lang: string) => void
  isRunning?:   boolean
}

export default function Navbar({
  roomName   = MOCK_ROOM.name,
  userCount  = MOCK_ROOM.userCount,
  language   = 'TypeScript',
  onRun,
  onShare,
  onLanguage,
  isRunning  = false,
}: NavbarProps) {
  const [langOpen,    setLangOpen]    = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [copied,      setCopied]      = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onShare?.()
  }

  const handleLang = (lang: string) => {
    onLanguage?.(lang)
    setLangOpen(false)
  }

  return (
    <header className="topbar" style={{ justifyContent: 'space-between' }}>

      {/* ── Left: Logo + Room ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>

        {/* Logo — Syne font */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1,  x: 0   }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}
        >
          {/* Logo mark */}
          <div style={{
            width:          26,
            height:         26,
            borderRadius:   7,
            background:     'var(--color-accent)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            boxShadow:      '0 0 12px var(--color-accent-glow)',
            flexShrink:     0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h4M2 7h10M2 10h7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Brand name — Syne */}
          <span style={{
            fontFamily:    'var(--font-heading)',  /* Syne */
            fontSize:      15,
            fontWeight:    700,
            color:         'var(--color-text-primary)',
            letterSpacing: '-0.03em',
          }}>
            Depot
          </span>
        </motion.div>

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: 'var(--color-border-md)', flexShrink: 0 }} />

        {/* Room name — Inter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
        >
          <span style={{
            fontFamily:   'var(--font-ui)',         /* Inter */
            fontSize:     13,
            fontWeight:   500,
            color:        'var(--color-text-primary)',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            maxWidth:     160,
          }}>
            {roomName}
          </span>

          <UserCountBadge count={userCount} />
        </motion.div>
      </div>

      {/* ── Center: Run Code ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1,  y: 0  }}
        transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
      >
        <Button
          variant="primary"
          size="sm"
          loading={isRunning}
          onClick={onRun}
          icon={
            !isRunning && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 2l7 4-7 4V2z" fill="currentColor"/>
              </svg>
            )
          }
          style={{
            paddingLeft:  14,
            paddingRight: 14,
            gap:          6,
            fontSize:     12,
            fontWeight:   600,
            letterSpacing: '0.01em',
          }}
        >
          {isRunning ? 'Running…' : 'Run Code'}
        </Button>
      </motion.div>

      {/* ── Right: Actions + Avatar ───────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1,  x: 0  }}
        transition={{ delay: 0.2, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >

        {/* Language picker — JetBrains Mono via LanguageBadge */}
        <div style={{ position: 'relative' }}>
          <motion.button
            onClick={() => setLangOpen(o => !o)}
            whileHover={{ background: 'var(--color-hover)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          4,
              background:   langOpen ? 'var(--color-hover)' : 'transparent',
              border:       '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding:      '3px 8px',
              cursor:       'pointer',
              transition:   'background 150ms ease',
            }}
          >
            <LanguageBadge language={language} />
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{
                transform:  langOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
                color:      'var(--color-text-muted)',
              }}
            >
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          {/* Language dropdown */}
          <AnimatePresence>
            {langOpen && (
              <>
                {/* Backdrop */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setLangOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{    opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position:     'absolute',
                    top:          'calc(100% + 6px)',
                    right:        0,
                    zIndex:       50,
                    background:   'var(--color-elevated)',
                    border:       '1px solid var(--color-border-md)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow:    'var(--shadow-lg)',
                    overflow:     'hidden',
                    minWidth:     140,
                    padding:      4,
                  }}
                >
                  {LANGUAGES.map((lang, i) => (
                    <motion.button
                      key={lang}
                      onClick={() => handleLang(lang)}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1,  x: 0  }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ background: 'var(--color-hover)' }}
                      style={{
                        width:        '100%',
                        display:      'flex',
                        alignItems:   'center',
                        gap:          8,
                        padding:      '6px 10px',
                        background:   lang === language ? 'var(--color-active)' : 'transparent',
                        border:       'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor:       'pointer',
                        textAlign:    'left',
                      }}
                    >
                      <LanguageBadge language={lang} />
                      {lang === language && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 'auto' }}>
                          <path d="M2 5l2.5 2.5L8 2.5" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Share button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          icon={
            copied
              ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="var(--color-success)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM4 4.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM8 7.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM5.44 5.56l1.12-.62M5.44 6.44l1.12.62" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          }
          style={{
            color:    copied ? 'var(--color-success)' : undefined,
            fontSize: 12,
          }}
        >
          {copied ? 'Copied!' : 'Share'}
        </Button>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'var(--color-border-md)' }} />

        {/* User avatar + profile dropdown */}
        <div style={{ position: 'relative' }}>
          <Avatar
            name={MOCK_USER.name}
            size="sm"
            status="online"
            onClick={() => setProfileOpen(o => !o)}
          />

          <AnimatePresence>
            {profileOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setProfileOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{    opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position:     'absolute',
                    top:          'calc(100% + 8px)',
                    right:        0,
                    zIndex:       50,
                    background:   'var(--color-elevated)',
                    border:       '1px solid var(--color-border-md)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow:    'var(--shadow-lg)',
                    minWidth:     200,
                    overflow:     'hidden',
                  }}
                >
                  {/* Profile header */}
                  <div style={{
                    padding:      '12px 14px',
                    borderBottom: '1px solid var(--color-border)',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                  }}>
                    <Avatar name={MOCK_USER.name} size="md" status="online" />
                    <div style={{ minWidth: 0 }}>
                      {/* Inter — UI label */}
                      <div style={{
                        fontFamily:   'var(--font-ui)',
                        fontSize:     13,
                        fontWeight:   500,
                        color:        'var(--color-text-primary)',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                      }}>
                        {MOCK_USER.name}
                      </div>
                      {/* Manrope — body/descriptive text */}
                      <div style={{
                        fontFamily:   'var(--font-body)',
                        fontSize:     11,
                        color:        'var(--color-text-muted)',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                      }}>
                        {MOCK_USER.email}
                      </div>
                    </div>
                  </div>

                  {/* Menu items — Inter */}
                  <div style={{ padding: 4 }}>
                    {[
                      { label: 'Settings',     icon: '⚙' },
                      { label: 'Keyboard shortcuts', icon: '⌨' },
                      { label: 'Documentation', icon: '📖' },
                    ].map(item => (
                      <motion.button
                        key={item.label}
                        whileHover={{ background: 'var(--color-hover)' }}
                        style={{
                          width:        '100%',
                          display:      'flex',
                          alignItems:   'center',
                          gap:          8,
                          padding:      '7px 10px',
                          background:   'transparent',
                          border:       'none',
                          borderRadius: 'var(--radius-sm)',
                          cursor:       'pointer',
                          fontFamily:   'var(--font-ui)',  /* Inter */
                          fontSize:     12,
                          color:        'var(--color-text-secondary)',
                          textAlign:    'left',
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{item.icon}</span>
                        {item.label}
                      </motion.button>
                    ))}

                    <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

                    <motion.button
                      whileHover={{ background: 'var(--color-danger-dim)' }}
                      style={{
                        width:        '100%',
                        display:      'flex',
                        alignItems:   'center',
                        gap:          8,
                        padding:      '7px 10px',
                        background:   'transparent',
                        border:       'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor:       'pointer',
                        fontFamily:   'var(--font-ui)',  /* Inter */
                        fontSize:     12,
                        color:        'var(--color-danger)',
                        textAlign:    'left',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5M8.5 9.5L12 6.5l-3.5-3M12 6.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Sign out
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </header>
  )
}