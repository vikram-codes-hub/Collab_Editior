import { motion } from 'framer-motion'

/* ============================================================
   LoadingScreen
   font: Syne      → "depot" logo
   font: Manrope   → status message
   font: JetBrains → connecting status line
   Used in: App.tsx (route transitions), EditorPage (room join),
            AuthPage (token validation on mount)
   ============================================================ */

interface LoadingScreenProps {
  message?: string      // e.g. "Joining room…", "Syncing…"
  mini?:    boolean     // small inline spinner instead of full page
}

/* ── Dot pulse animation ── */
function PulseDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   'var(--color-accent)',
            display:      'block',
          }}
        />
      ))}
    </div>
  )
}

/* ── Mini spinner (inline use) ── */
export function MiniSpinner({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 16 16" fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeDasharray="30" strokeDashoffset="10" opacity="0.8"/>
    </motion.svg>
  )
}

/* ── Full page loader ── */
export default function LoadingScreen({ message = 'Loading…', mini = false }: LoadingScreenProps) {
  if (mini) {
    return (
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            8,
        padding:        '2rem',
      }}>
        <MiniSpinner />
        {/* font: Manrope */}
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize:   '0.8125rem',
          color:      'var(--color-text-muted)',
        }}>
          {message}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'var(--color-app)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '1.5rem',
        zIndex:         999,
      }}
    >
      {/* Background dot grid */}
      <div style={{
        position:        'absolute',
        inset:           0,
        backgroundImage: 'radial-gradient(circle, rgba(124,111,247,0.06) 1px, transparent 1px)',
        backgroundSize:  '32px 32px',
        pointerEvents:   'none',
      }}/>

      {/* Logo — font: Syne */}
      <motion.span
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1,  y: 0  }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily:    'var(--font-heading)',
          fontSize:      '1.5rem',
          fontWeight:    800,
          color:         'var(--color-text-primary)',
          letterSpacing: '-0.03em',
          position:      'relative',
          zIndex:        1,
        }}
      >
        depot
      </motion.span>

      {/* Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <PulseDots />
      </motion.div>

      {/* Status message — font: JetBrains Mono */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        style={{
          fontFamily: 'var(--font-code)',        /* JetBrains Mono */
          fontSize:   '0.75rem',
          color:      'var(--color-text-muted)',
          position:   'relative',
          zIndex:     1,
          letterSpacing: '0.02em',
        }}
      >
        {message}
      </motion.span>
    </motion.div>
  )
}