import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface RoomLayoutProps {
  notepad:  React.ReactNode
  editor:   React.ReactNode
  terminal: React.ReactNode
  video:    React.ReactNode
}

const PANEL_MIN = 180

export default function RoomLayout({ notepad, editor, terminal, video }: RoomLayoutProps) {
  // Left panel width (notepad)
  const [leftW, setLeftW]     = useState(260)
  // Right panel width (video)
  const [rightW, setRightW]   = useState(280)
  // Terminal height as % of the center column
  const [termH, setTermH]     = useState(220)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragging     = useRef<null | 'left' | 'right' | 'term'>(null)
  const startX       = useRef(0)
  const startY       = useRef(0)
  const startVal     = useRef(0)

  const onMouseDown = useCallback(
    (which: 'left' | 'right' | 'term') =>
      (e: React.MouseEvent) => {
        e.preventDefault()
        dragging.current = which
        startX.current   = e.clientX
        startY.current   = e.clientY
        startVal.current = which === 'left' ? leftW : which === 'right' ? rightW : termH

        const onMove = (ev: MouseEvent) => {
          const container = containerRef.current
          if (!container || !dragging.current) return
          const totalW = container.offsetWidth
          const totalH = container.offsetHeight

          if (dragging.current === 'left') {
            const next = startVal.current + (ev.clientX - startX.current)
            setLeftW(Math.max(PANEL_MIN, Math.min(next, totalW * 0.4)))
          } else if (dragging.current === 'right') {
            const next = startVal.current - (ev.clientX - startX.current)
            setRightW(Math.max(PANEL_MIN, Math.min(next, totalW * 0.4)))
          } else if (dragging.current === 'term') {
            const next = startVal.current - (ev.clientY - startY.current)
            setTermH(Math.max(100, Math.min(next, totalH * 0.7)))
          }
        }

        const onUp = () => {
          dragging.current = null
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
      },
    [leftW, rightW, termH]
  )

  const panelVariants = {
    hidden:  { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    }),
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-hidden gap-0"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── Left: Notepad ───────────────────── */}
      <motion.div
        custom={0}
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="panel flex-shrink-0"
        style={{ width: leftW }}
      >
        {notepad}
      </motion.div>

      {/* ── Divider: left ───────────────────── */}
      <div
        className="divider divider-v"
        style={{ margin: '0 2px' }}
        onMouseDown={onMouseDown('left')}
      />

      {/* ── Center: Editor + Terminal ────────── */}
      <motion.div
        custom={1}
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col flex-1 overflow-hidden gap-0"
        style={{ minWidth: PANEL_MIN }}
      >
        {/* Editor */}
        <div
          className="panel flex-1 overflow-hidden"
          style={{ minHeight: 120 }}
        >
          {editor}
        </div>

        {/* Divider: horizontal */}
        <div
          className="divider divider-h"
          style={{ margin: '2px 0' }}
          onMouseDown={onMouseDown('term')}
        />

        {/* Terminal */}
        <motion.div
          className="panel flex-shrink-0 overflow-hidden"
          style={{ height: termH }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {terminal}
        </motion.div>
      </motion.div>

      {/* ── Divider: right ──────────────────── */}
      <div
        className="divider divider-v"
        style={{ margin: '0 2px' }}
        onMouseDown={onMouseDown('right')}
      />

      {/* ── Right: Video ────────────────────── */}
      <motion.div
        custom={2}
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="panel flex-shrink-0"
        style={{ width: rightW }}
      >
        {video}
      </motion.div>
    </div>
  )
}