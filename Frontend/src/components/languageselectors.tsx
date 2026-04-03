import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ============================================================
   LanguageSelector
   font: JetBrains (--font-code) → language names in list + trigger
   font: Inter     (--font-ui)   → section headings, search input
   Used in: Navbar (top bar dropdown), StatusBar (bottom bar),
            CreateRoomModal (language picker)
   ============================================================ */

const LANGUAGES: { name: string; ext: string; color: string }[] = [
  { name: 'JavaScript', ext: 'js',  color: '#f7df1e' },
  { name: 'TypeScript', ext: 'ts',  color: '#3178c6' },
  { name: 'Python',     ext: 'py',  color: '#3572a5' },
  { name: 'Go',         ext: 'go',  color: '#00acd7' },
  { name: 'Rust',       ext: 'rs',  color: '#ce4a00' },
  { name: 'C++',        ext: 'cpp', color: '#f34b7d' },
  { name: 'Java',       ext: 'java',color: '#b07219' },
  { name: 'HTML',       ext: 'html',color: '#e44b23' },
  { name: 'CSS',        ext: 'css', color: '#563d7c' },
  { name: 'JSON',       ext: 'json',color: '#40a977' },
  { name: 'Markdown',   ext: 'md',  color: '#083fa1' },
  { name: 'Shell',      ext: 'sh',  color: '#89e051' },
  { name: 'SQL',        ext: 'sql', color: '#e38c00' },
  { name: 'YAML',       ext: 'yml', color: '#cb171e' },
]

const ChevronIcon = ({ open }: { open: boolean }) => (
  <motion.svg
    animate={{ rotate: open ? 180 : 0 }}
    transition={{ duration: 0.2 }}
    width="10" height="10" viewBox="0 0 10 10" fill="none"
  >
    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </motion.svg>
)

const SearchIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M7.5 7.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

interface LanguageSelectorProps {
  value:    string
  onChange: (lang: string) => void
  compact?: boolean   // statusbar compact mode
}

export default function LanguageSelector({ value, onChange, compact = false }: LanguageSelectorProps) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = LANGUAGES.find(l => l.name === value) ?? LANGUAGES[0]

  const filtered = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.ext.toLowerCase().includes(search.toLowerCase())
  )

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const select = (lang: string) => {
    onChange(lang)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Trigger — font: JetBrains Mono */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ background: compact ? 'rgba(255,255,255,0.15)' : 'var(--color-hover)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          compact ? 4 : 6,
          background:   compact ? 'rgba(255,255,255,0.12)' : 'transparent',
          border:       compact ? 'none' : '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xs)',
          color:        compact ? 'rgba(255,255,255,0.9)' : 'var(--color-text-secondary)',
          padding:      compact ? '2px 6px' : '4px 8px',
          cursor:       'pointer',
          transition:   'background 150ms ease',
        }}
      >
        {/* Language dot */}
        <span style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   current.color,
          flexShrink:   0,
        }}/>
        {/* font: JetBrains Mono — language name */}
        <span style={{
          fontFamily: 'var(--font-code)',
          fontSize:   compact ? '0.7rem' : '0.775rem',
          fontWeight: 400,
        }}>
          {current.name}
        </span>
        <ChevronIcon open={open} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1,  scale: 1,    y: 0  }}
            exit={{ opacity: 0,    scale: 0.96, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position:     'absolute',
              top:          'calc(100% + 6px)',
              left:         compact ? 'auto' : 0,
              right:        compact ? 0 : 'auto',
              width:        200,
              background:   'var(--color-elevated)',
              border:       '1px solid var(--color-border-md)',
              borderRadius: 'var(--radius-md)',
              boxShadow:    'var(--shadow-md)',
              zIndex:       150,
              overflow:     'hidden',
            }}
          >
            {/* Search — font: Inter */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              padding:      '8px 10px',
              borderBottom: '1px solid var(--color-border)',
              color:        'var(--color-text-muted)',
            }}>
              <SearchIcon />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter…"
                style={{
                  background:  'none',
                  border:      'none',
                  outline:     'none',
                  fontFamily:  'var(--font-ui)',      /* Inter */
                  fontSize:    '0.775rem',
                  color:       'var(--color-text-primary)',
                  width:       '100%',
                }}
              />
            </div>

            {/* Language list — font: JetBrains Mono */}
            <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
              {filtered.length === 0 ? (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   '0.75rem',
                  color:      'var(--color-text-muted)',
                  padding:    '12px 12px',
                  textAlign:  'center',
                }}>
                  No match
                </div>
              ) : (
                filtered.map(lang => (
                  <motion.button
                    key={lang.name}
                    onClick={() => select(lang.name)}
                    whileHover={{ background: 'var(--color-hover)' }}
                    style={{
                      width:      '100%',
                      display:    'flex',
                      alignItems: 'center',
                      gap:        8,
                      padding:    '6px 12px',
                      background: lang.name === value ? 'var(--color-active)' : 'transparent',
                      border:     'none',
                      cursor:     'pointer',
                      textAlign:  'left',
                      transition: 'background 100ms ease',
                    }}
                  >
                    <span style={{
                      width:        7,
                      height:       7,
                      borderRadius: '50%',
                      background:   lang.color,
                      flexShrink:   0,
                    }}/>
                    {/* font: JetBrains Mono — language name */}
                    <span style={{
                      fontFamily: 'var(--font-code)',
                      fontSize:   '0.775rem',
                      color:      lang.name === value
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-secondary)',
                      flex:       1,
                    }}>
                      {lang.name}
                    </span>
                    {/* Extension — font: JetBrains Mono */}
                    <span style={{
                      fontFamily: 'var(--font-code)',
                      fontSize:   '0.65rem',
                      color:      'var(--color-text-hint)',
                    }}>
                      .{lang.ext}
                    </span>
                    {lang.name === value && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}