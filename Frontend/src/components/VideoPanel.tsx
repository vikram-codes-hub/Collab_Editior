import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tooltip from './tooltip'

/* ============================================================
   MediaControls + VideoTile + VideoPanel
   font: Inter     (--font-ui)  → labels, names, button text
   font: Manrope   (--font-body)→ "ROOM" section heading
   Used in: EditorPage right panel (VideoPanel),
            Mobile: floating bottom bar (MediaControls)
   ============================================================ */

/* ── Icons ──────────────────────────────────────────────────── */
const MicOnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M3 7.5a4.5 4.5 0 009 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M7.5 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const MicOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M2 2l11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M9 9.3A2.5 2.5 0 016 7V4.5M5 3A2.5 2.5 0 0110 5v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M3 7.5a4.5 4.5 0 008.5 1.5M7.5 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const CamOnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M1 5a1 1 0 011-1h8a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V5z" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M11 6.5l3-2v5l-3-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CamOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M2 2l11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M5 4H10a1 1 0 011 1v1.5M11 8.5V10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M11 6.5l3-2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const HeadphonesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M2.5 8V7a5 5 0 0110 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <rect x="1" y="8" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="11" y="8" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
)

const LeaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M8.5 4.5L11 7l-2.5 2.5M11 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

/* ============================================================
   MediaControls — mic / cam / audio toggle strip
   Used in: VideoPanel (bottom), mobile floating bar
   ============================================================ */

interface MediaControlsProps {
  micOn:      boolean
  camOn:      boolean
  audioOn:    boolean
  onMicToggle:   () => void
  onCamToggle:   () => void
  onAudioToggle: () => void
  onLeave?:      () => void
  compact?:      boolean    // horizontal icon-only bar
}

function MediaBtn({
  on, onToggle, onIcon, offIcon, label, danger = false,
}: {
  on: boolean; onToggle: () => void
  onIcon: React.ReactNode; offIcon: React.ReactNode
  label: string; danger?: boolean
}) {
  return (
    <Tooltip content={`${on ? 'Turn off' : 'Turn on'} ${label}`} side="top">
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            3,
          background:     'none',
          border:         'none',
          cursor:         'pointer',
          padding:        '2px 4px',
        }}
      >
        <div style={{
          width:          32,
          height:         32,
          borderRadius:   '50%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          background:     !on
            ? (danger ? 'var(--color-danger-dim)'  : 'rgba(248,113,113,0.12)')
            : 'var(--color-hover)',
          border: `1px solid ${
            !on
              ? (danger ? 'rgba(248,113,113,0.3)' : 'rgba(248,113,113,0.25)')
              : 'var(--color-border-md)'
          }`,
          color: !on ? 'var(--color-danger)' : 'var(--color-text-secondary)',
          transition: 'all 150ms ease',
        }}>
          {on ? onIcon : offIcon}
        </div>
        {/* font: Inter */}
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontSize:   '0.6rem',
          color:      'var(--color-text-muted)',
          userSelect: 'none',
        }}>
          {label}
        </span>
      </motion.button>
    </Tooltip>
  )
}

export function MediaControls({
  micOn, camOn, audioOn,
  onMicToggle, onCamToggle, onAudioToggle, onLeave,
  compact = false,
}: MediaControlsProps) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: compact ? 'center' : 'space-around',
      gap:            compact ? 6 : 0,
      padding:        compact ? '4px 8px' : '6px 4px 4px',
    }}>
      <MediaBtn
        on={micOn}   onToggle={onMicToggle}
        onIcon={<MicOnIcon />} offIcon={<MicOffIcon />}
        label="Mic"
      />
      <MediaBtn
        on={camOn}   onToggle={onCamToggle}
        onIcon={<CamOnIcon />} offIcon={<CamOffIcon />}
        label="Cam"
      />
      <MediaBtn
        on={audioOn} onToggle={onAudioToggle}
        onIcon={<HeadphonesIcon />} offIcon={<HeadphonesIcon />}
        label="Audio"
      />
      {onLeave && (
        <Tooltip content="Leave room" side="top">
          <motion.button
            onClick={onLeave}
            whileHover={{ scale: 1.06, background: 'var(--color-danger)', color: '#fff' }}
            whileTap={{ scale: 0.92 }}
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            3,
              background:     'none',
              border:         'none',
              cursor:         'pointer',
              padding:        '2px 4px',
            }}
          >
            <div style={{
              width:          32,
              height:         32,
              borderRadius:   '50%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     'var(--color-danger-dim)',
              border:         '1px solid rgba(248,113,113,0.25)',
              color:          'var(--color-danger)',
              transition:     'all 150ms ease',
            }}>
              <LeaveIcon />
            </div>
            {/* font: Inter */}
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize:   '0.6rem',
              color:      'var(--color-text-muted)',
              userSelect: 'none',
            }}>
              Leave
            </span>
          </motion.button>
        </Tooltip>
      )}
    </div>
  )
}

/* ============================================================
   VideoTile — single participant video card
   Used in: VideoPanel (one tile per participant)
   ============================================================ */

const USER_COLORS = ['#a78bfa','#fb923c','#34d399','#f472b6','#fbbf24','#60a5fa']

interface VideoTileProps {
  name:       string
  colorIdx?:  number
  videoRef?:  React.RefObject<HTMLVideoElement>
  speaking?:  boolean
  muted?:     boolean
  camOff?:    boolean
  isLocal?:   boolean
}

export function VideoTile({
  name, colorIdx = 0, videoRef,
  speaking = false, muted = false, camOff = false, isLocal = false,
}: VideoTileProps) {
  const color    = USER_COLORS[colorIdx % USER_COLORS.length]
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.div
      animate={{
        borderColor: speaking ? color : 'var(--color-border)',
        boxShadow:   speaking ? `0 0 0 1.5px ${color}60` : 'none',
      }}
      transition={{ duration: 0.2 }}
      style={{
        flex:         1,
        background:   '#0a0a12',
        border:       '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        position:     'relative',
        overflow:     'hidden',
        minHeight:    80,
      }}
    >
      {/* Video element */}
      {videoRef && !camOff && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Avatar fallback (cam off or no stream) */}
      {camOff && (
        <div style={{
          width:          48,
          height:         48,
          borderRadius:   '50%',
          background:     color + '25',
          border:         `1px solid ${color}50`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'var(--font-ui)',
          fontSize:       '1.1rem',
          fontWeight:     600,
          color:          color,
        }}>
          {initials}
        </div>
      )}

      {/* Name tag — font: Inter */}
      <div style={{
        position:     'absolute',
        bottom:       5,
        left:         6,
        display:      'flex',
        alignItems:   'center',
        gap:          5,
      }}>
        {speaking && (
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              width:        5,
              height:       5,
              borderRadius: '50%',
              background:   color,
              flexShrink:   0,
            }}
          />
        )}
        <span style={{
          fontFamily:   'var(--font-ui)',       /* Inter */
          fontSize:     '0.65rem',
          fontWeight:   500,
          color:        '#e0e0ff',
          background:   'rgba(0,0,0,0.62)',
          padding:      '1px 6px',
          borderRadius: 'var(--radius-full)',
          backdropFilter: 'blur(4px)',
        }}>
          {isLocal ? 'You' : name}
        </span>
      </div>

      {/* Muted indicator */}
      {muted && (
        <div style={{
          position:     'absolute',
          top:          5,
          right:        5,
          background:   'rgba(248,113,113,0.9)',
          borderRadius: 'var(--radius-full)',
          padding:      '2px 3px',
          display:      'flex',
        }}>
          <MicOffIcon />
        </div>
      )}
    </motion.div>
  )
}

/* ============================================================
   VideoPanel — full right column
   Used in: EditorPage (grid-area: video)
   ============================================================ */

interface Participant {
  id:        string
  name:      string
  colorIdx?: number
  speaking?: boolean
  muted?:    boolean
  camOff?:   boolean
  isLocal?:  boolean
  videoRef?: React.RefObject<HTMLVideoElement>
}

interface VideoPanelProps {
  participants: Participant[]
  micOn:        boolean
  camOn:        boolean
  audioOn:      boolean
  onMicToggle:    () => void
  onCamToggle:    () => void
  onAudioToggle:  () => void
  onLeave?:       () => void
}

export function VideoPanel({
  participants,
  micOn, camOn, audioOn,
  onMicToggle, onCamToggle, onAudioToggle, onLeave,
}: VideoPanelProps) {
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100%',
      overflow:      'hidden',
    }}>
      {/* Header — font: Inter */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '8px 10px 6px',
        borderBottom:   '1px solid var(--color-border)',
        flexShrink:     0,
      }}>
        {/* font: Inter — "ROOM" label */}
        <span style={{
          fontFamily:    'var(--font-ui)',
          fontSize:      '0.65rem',
          fontWeight:    600,
          color:         'var(--color-text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Room
        </span>
        {/* Online count badge */}
        <span style={{
          fontFamily:   'var(--font-ui)',
          fontSize:     '0.65rem',
          color:        'var(--color-text-muted)',
          background:   'var(--color-elevated)',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          padding:      '1px 7px',
        }}>
          {participants.length} online
        </span>
      </div>

      {/* Tiles */}
      <div style={{
        flex:          1,
        overflowY:     'auto',
        padding:       '6px 6px 0',
        display:       'flex',
        flexDirection: 'column',
        gap:           5,
      }}>
        <AnimatePresence>
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1,  scale: 1   }}
              exit={{ opacity: 0,    scale: 0.9  }}
              transition={{ delay: i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <VideoTile
                name={p.name}
                colorIdx={p.colorIdx ?? i}
                videoRef={p.videoRef}
                speaking={p.speaking}
                muted={p.muted}
                camOff={p.camOff ?? (!camOn && p.isLocal)}
                isLocal={p.isLocal}
              />
              {/* Name below tile — font: Inter */}
              <span style={{
                fontFamily:   'var(--font-ui)',
                fontSize:     '0.65rem',
                color:        'var(--color-text-muted)',
                textAlign:    'center',
                padding:      '3px 0 1px',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}>
                {p.isLocal ? `${p.name} (you)` : p.name}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {participants.length === 0 && (
          <div style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            6,
            padding:        '1rem',
            textAlign:      'center',
          }}>
            {/* font: Manrope */}
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize:   '0.75rem',
              color:      'var(--color-text-hint)',
            }}>
              No one else here yet
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <MediaControls
          micOn={micOn} camOn={camOn} audioOn={audioOn}
          onMicToggle={onMicToggle}
          onCamToggle={onCamToggle}
          onAudioToggle={onAudioToggle}
          onLeave={onLeave}
        />
      </div>
    </div>
  )
}