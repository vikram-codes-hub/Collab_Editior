import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

/* ============================================================
   Sidebar — left panel wrapper (wraps Notepad on mobile)
   font: Inter   (--font-ui)  → panel header, toggle button
   Used in: EditorPage (grid-area: notes on desktop,
            collapsible drawer on mobile/tablet)
   ============================================================ */

interface SidebarProps {
  children:  React.ReactNode
  title?:    string
  badge?:    string       // e.g. "synced", "editing"
  badgeOk?:  boolean      // green vs yellow badge
}

export function Sidebar({ children, title = 'Notes', badge, badgeOk = true }: SidebarProps) {
  const [open, setOpen] = useState(true)

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="notes-panel"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* Header — font: Inter */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '7px 10px',
          borderBottom:   '1px solid var(--color-border)',
          flexShrink:     0,
          background:     'var(--color-elevated)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily:    'var(--font-ui)',      /* Inter */
              fontSize:      '0.7rem',
              fontWeight:    600,
              color:         'var(--color-text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {title}
            </span>
            {badge && (
              <span style={{
                fontFamily:   'var(--font-ui)',
                fontSize:     '0.6rem',
                fontWeight:   500,
                color:        badgeOk ? 'var(--color-success)' : 'var(--color-warning)',
                background:   badgeOk ? 'var(--color-success-dim)' : 'var(--color-warning-dim)',
                border:       `1px solid ${badgeOk ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                borderRadius: 'var(--radius-full)',
                padding:      '1px 6px',
              }}>
                {badge}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>

      {/* Mobile: bottom sheet toggle */}
      <div className="notes-mobile-toggle" style={{ display: 'none' }}>
        <motion.button
          onClick={() => setOpen(o => !o)}
          whileTap={{ scale: 0.95 }}
          style={{
            position:     'fixed',
            bottom:       80,
            left:         12,
            zIndex:       60,
            background:   'var(--color-elevated)',
            border:       '1px solid var(--color-border-md)',
            borderRadius: 'var(--radius-full)',
            color:        'var(--color-text-secondary)',
            fontFamily:   'var(--font-ui)',
            fontSize:     '0.7rem',
            fontWeight:   500,
            padding:      '6px 12px',
            cursor:       'pointer',
            display:      'flex',
            alignItems:   'center',
            gap:          5,
            boxShadow:    'var(--shadow-md)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3h8M2 6h8M2 9h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Notes
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position:      'fixed',
                bottom:        0,
                left:          0,
                right:         0,
                height:        '60vh',
                background:    'var(--color-surface)',
                borderTop:     '1px solid var(--color-border-md)',
                borderRadius:  'var(--radius-lg) var(--radius-lg) 0 0',
                zIndex:        59,
                display:       'flex',
                flexDirection: 'column',
                overflow:      'hidden',
              }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

/* ============================================================
   Presence — shows who's currently in the room (avatar strip)
   font: Inter (--font-ui) → names, "editing" label
   Used in: Navbar (top bar, right side of room name)
   ============================================================ */

const USER_COLORS = ['#a78bfa','#fb923c','#34d399','#f472b6','#fbbf24','#60a5fa']

interface PresenceUser {
  id:      string
  name:    string
  editing: boolean     // actively typing right now
  color?:  string
}

interface PresenceProps {
  users: PresenceUser[]
  max?:  number
}

export function Presence({ users, max = 5 }: PresenceProps) {
  const visible  = users.slice(0, max)
  const overflow = users.length - max
  const overlap  = 8

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Stacked avatars */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {visible.map((u, i) => {
          const color    = u.color ?? USER_COLORS[i % USER_COLORS.length]
          const initials = u.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1   }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ delay: i * 0.04, duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              title={u.name}
              style={{
                marginLeft:     i === 0 ? 0 : -overlap,
                zIndex:         visible.length - i,
                width:          26,
                height:         26,
                borderRadius:   '50%',
                background:     color + '28',
                border:         `1.5px solid ${u.editing ? color : 'var(--color-surface)'}`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                boxShadow:      u.editing ? `0 0 0 1px ${color}` : '0 0 0 1.5px var(--color-surface)',
                cursor:         'default',
                transition:     'border-color 200ms ease, box-shadow 200ms ease',
                position:       'relative',
              }}
            >
              {/* font: Inter */}
              <span style={{
                fontFamily: 'var(--font-ui)',
                fontSize:   '0.6rem',
                fontWeight: 600,
                color:      color,
                userSelect: 'none',
              }}>
                {initials}
              </span>

              {/* Editing pulse */}
              {u.editing && (
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{
                    position:     'absolute',
                    inset:        -2,
                    borderRadius: '50%',
                    border:       `1px solid ${color}`,
                    pointerEvents:'none',
                  }}
                />
              )}
            </motion.div>
          )
        })}

        {overflow > 0 && (
          <div style={{
            marginLeft:     -overlap,
            width:          26,
            height:         26,
            borderRadius:   '50%',
            background:     'var(--color-elevated)',
            border:         '1.5px solid var(--color-surface)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         0,
            boxShadow:      '0 0 0 1.5px var(--color-surface)',
          }}>
            {/* font: Inter */}
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize:   '0.6rem',
              fontWeight: 600,
              color:      'var(--color-text-muted)',
            }}>
              +{overflow}
            </span>
          </div>
        )}
      </div>

      {/* "X editing" label — font: Inter */}
      {users.some(u => u.editing) && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize:   '0.7rem',
            color:      'var(--color-text-muted)',
          }}
        >
          {users.filter(u => u.editing).length} editing
        </motion.span>
      )}
    </div>
  )
}

/* ============================================================
   Cursors — remote cursor overlays on Monaco Editor
   font: Inter (--font-ui) → cursor name label
   Used in: editor.tsx (rendered over Monaco as absolute overlay)
   ============================================================ */

interface CursorData {
  userId:  string
  name:    string
  color:   string
  line:    number
  column:  number
  lineHeight: number    // px, from Monaco layout info
  charWidth:  number    // px, from Monaco layout info
  offsetTop:  number    // px, editor content top offset
  offsetLeft: number    // px, editor content left offset (after line numbers)
}

interface CursorsProps {
  cursors: CursorData[]
}

export function Cursors({ cursors }: CursorsProps) {
  return (
    <div style={{
      position:      'absolute',
      inset:         0,
      pointerEvents: 'none',
      overflow:      'hidden',
      zIndex:        10,
    }}>
      <AnimatePresence>
        {cursors.map(c => {
          const top  = c.offsetTop  + (c.line   - 1) * c.lineHeight
          const left = c.offsetLeft + (c.column - 1) * c.charWidth

          return (
            <motion.div
              key={c.userId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, top, left }}
              exit={{ opacity: 0 }}
              transition={{ top: { duration: 0.12 }, left: { duration: 0.12 }, opacity: { duration: 0.15 } }}
              style={{
                position:  'absolute',
                width:     2,
                height:    c.lineHeight,
                background:c.color,
                borderRadius: 1,
              }}
            >
              {/* Name label — font: Inter */}
              <span style={{
                position:     'absolute',
                top:          -18,
                left:         0,
                fontFamily:   'var(--font-ui)',      /* Inter */
                fontSize:     '0.6rem',
                fontWeight:   500,
                color:        '#fff',
                background:   c.color,
                padding:      '1px 5px',
                borderRadius: '3px 3px 3px 0',
                whiteSpace:   'nowrap',
                pointerEvents:'none',
                boxShadow:    '0 1px 3px rgba(0,0,0,0.3)',
              }}>
                {c.name}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}