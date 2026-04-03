import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ============================================================
   Modal
   font: Syne    → modal title
   font: Manrope → modal description / body text
   font: Inter   → buttons, labels, inputs inside modal
   Used in: HomePage (create room), EditorPage (share room,
            confirm leave, keyboard shortcuts)
   ============================================================ */

interface ModalProps {
  open:        boolean
  onClose:     () => void
  title?:      string
  description?: string
  size?:       'sm' | 'md' | 'lg'
  children:    React.ReactNode
  footer?:     React.ReactNode    // custom footer buttons
  closeable?:  boolean            // show × button, default true
}

const SIZE_MAP = { sm: 360, md: 480, lg: 640 }

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export default function Modal({
  open,
  onClose,
  title,
  description,
  size      = 'md',
  children,
  footer,
  closeable = true,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeable ? onClose : undefined}
            style={{
              position:       'fixed',
              inset:          0,
              background:     'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              zIndex:         100,
              cursor:         closeable ? 'pointer' : 'default',
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1,  scale: 1,    y: 0  }}
            exit={{ opacity: 0,    scale: 0.95, y: 8  }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              position:     'fixed',
              top:          '50%',
              left:         '50%',
              transform:    'translate(-50%, -50%)',
              width:        `min(${SIZE_MAP[size]}px, calc(100vw - 2rem))`,
              background:   'var(--color-surface)',
              border:       '1px solid var(--color-border-md)',
              borderRadius: 'var(--radius-xl)',
              boxShadow:    'var(--shadow-lg)',
              zIndex:       101,
              overflow:     'hidden',
              maxHeight:    'calc(100vh - 4rem)',
              display:      'flex',
              flexDirection:'column',
            }}
          >
            {/* Header */}
            {(title || closeable) && (
              <div style={{
                display:        'flex',
                alignItems:     'flex-start',
                justifyContent: 'space-between',
                padding:        '1.375rem 1.5rem 0',
                gap:            12,
                flexShrink:     0,
              }}>
                <div>
                  {/* font: Syne */}
                  {title && (
                    <h2 style={{
                      fontFamily:    'var(--font-heading)',
                      fontSize:      '1.1rem',
                      fontWeight:    700,
                      color:         'var(--color-text-primary)',
                      letterSpacing: '-0.02em',
                      margin:        0,
                      marginBottom:  description ? 4 : 0,
                    }}>
                      {title}
                    </h2>
                  )}
                  {/* font: Manrope */}
                  {description && (
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize:   '0.8rem',
                      color:      'var(--color-text-muted)',
                      margin:     0,
                      lineHeight: 1.6,
                    }}>
                      {description}
                    </p>
                  )}
                </div>

                {/* Close button */}
                {closeable && (
                  <motion.button
                    onClick={onClose}
                    whileHover={{ background: 'var(--color-hover)' }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background:   'transparent',
                      border:       '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      color:        'var(--color-text-muted)',
                      cursor:       'pointer',
                      padding:      6,
                      display:      'flex',
                      flexShrink:   0,
                      transition:   'background 150ms ease',
                    }}
                  >
                    <CloseIcon />
                  </motion.button>
                )}
              </div>
            )}

            {/* Body */}
            <div style={{
              padding:    '1.25rem 1.5rem',
              overflowY:  'auto',
              flex:       1,
            }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'flex-end',
                gap:            8,
                padding:        '0 1.5rem 1.375rem',
                flexShrink:     0,
                borderTop:      '1px solid var(--color-border)',
                paddingTop:     '1rem',
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ============================================================
   ConfirmModal — quick destructive action confirm
   Used in: EditorPage (leave room, clear terminal)
   ============================================================ */
interface ConfirmModalProps {
  open:      boolean
  onClose:   () => void
  onConfirm: () => void
  title:     string
  message:   string
  confirmLabel?: string
  danger?:   boolean
}

export function ConfirmModal({
  open, onClose, onConfirm,
  title, message,
  confirmLabel = 'Confirm',
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <motion.button
            onClick={onClose}
            whileHover={{ background: 'var(--color-hover)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily:   'var(--font-ui)',
              fontSize:     '0.8125rem',
              fontWeight:   500,
              background:   'transparent',
              border:       '1px solid var(--color-border-md)',
              borderRadius: 'var(--radius-sm)',
              color:        'var(--color-text-secondary)',
              padding:      '0.45rem 1rem',
              cursor:       'pointer',
              transition:   'background 150ms ease',
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={() => { onConfirm(); onClose() }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily:   'var(--font-ui)',
              fontSize:     '0.8125rem',
              fontWeight:   500,
              background:   danger ? 'var(--color-danger)' : 'var(--color-accent)',
              color:        '#fff',
              border:       'none',
              borderRadius: 'var(--radius-sm)',
              padding:      '0.45rem 1rem',
              cursor:       'pointer',
            }}
          >
            {confirmLabel}
          </motion.button>
        </>
      }
    >
      {/* font: Manrope */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize:   '0.8125rem',
        color:      'var(--color-text-secondary)',
        lineHeight: 1.65,
        margin:     0,
      }}>
        {message}
      </p>
    </Modal>
  )
}