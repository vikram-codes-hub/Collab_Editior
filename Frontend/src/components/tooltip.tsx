import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ============================================================
   Tooltip
   font: Inter (--font-ui) — hint labels
   Used in: Navbar (icon buttons), MediaControls, ShareButton,
            Editor toolbar, Terminal header buttons
   ============================================================ */

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content:   string
  side?:     TooltipSide
  delay?:    number          // ms before showing, default 400
  children:  React.ReactElement
  disabled?: boolean
}

export default function Tooltip({
  content,
  side    = 'top',
  delay   = 400,
  children,
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    if (disabled) return
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const offset = 8
  const posStyle: Record<TooltipSide, React.CSSProperties> = {
    top:    { bottom: `calc(100% + ${offset}px)`, left: '50%', transform: 'translateX(-50%)' },
    bottom: { top:    `calc(100% + ${offset}px)`, left: '50%', transform: 'translateX(-50%)' },
    left:   { right:  `calc(100% + ${offset}px)`, top:  '50%', transform: 'translateY(-50%)' },
    right:  { left:   `calc(100% + ${offset}px)`, top:  '50%', transform: 'translateY(-50%)' },
  }

  const motionProps: Record<TooltipSide, object> = {
    top:    { initial: { opacity: 0, y: 4  }, animate: { opacity: 1, y: 0  } },
    bottom: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0  } },
    left:   { initial: { opacity: 0, x: 4  }, animate: { opacity: 1, x: 0  } },
    right:  { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0  } },
  }

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            {...motionProps[side]}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position:     'absolute',
              ...posStyle[side],
              background:   'var(--color-elevated)',
              border:       '1px solid var(--color-border-md)',
              borderRadius: 'var(--radius-xs)',
              padding:      '4px 9px',
              fontFamily:   'var(--font-ui)',       /* Inter */
              fontSize:     '0.7rem',
              fontWeight:   500,
              color:        'var(--color-text-primary)',
              whiteSpace:   'nowrap',
              pointerEvents:'none',
              zIndex:       200,
              boxShadow:    'var(--shadow-sm)',
              letterSpacing:'0.01em',
            }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}