import { motion } from 'framer-motion'

/* ============================================================
   VideoTile — single participant video card
   font: Inter (--font-ui) → name tag, labels
   Used in: VideoPanel (one tile per participant),
            EditorPage right panel
   ============================================================ */

/* ── Icons ──────────────────────────────────────────────────── */
const MicOffIcon = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="1" width="4" height="7" rx="2" />
    <path d="M2 7a5 5 0 0010 0M7 12v2M2 2l10 10" strokeLinecap="round" />
  </svg>
)

/* ── Colour palette ─────────────────────────────────────────── */
const USER_COLORS = [
  '#a78bfa',
  '#fb923c',
  '#34d399',
  '#f472b6',
  '#fbbf24',
  '#60a5fa',
]

/* ── Props ──────────────────────────────────────────────────── */
export interface VideoTileProps {
  /** Display name of the participant */
  name: string
  /** Index into USER_COLORS palette (wraps around) */
  colorIdx?: number
  /** Ref to the <video> element carrying the MediaStream */
  videoRef?: React.RefObject<HTMLVideoElement>
  /** Whether this participant is currently speaking */
  speaking?: boolean
  /** Whether their microphone is muted */
  muted?: boolean
  /** Whether their camera is off (shows avatar fallback) */
  camOff?: boolean
  /** True for the local user — mutes <video> and shows "You" label */
  isLocal?: boolean
  /** Optional: show an offline overlay */
  offline?: boolean
}

/* ── Component ──────────────────────────────────────────────── */
export default function VideoTile({
  name,
  colorIdx  = 0,
  videoRef,
  speaking  = false,
  muted     = false,
  camOff    = false,
  isLocal   = false,
  offline   = false,
}: VideoTileProps) {
  const color    = USER_COLORS[colorIdx % USER_COLORS.length]
  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      animate={{
        borderColor: speaking ? color : 'var(--color-border)',
        boxShadow:   speaking ? `0 0 0 1.5px ${color}60` : 'none',
      }}
      transition={{ duration: 0.2 }}
      style={{
        position:       'relative',
        flex:            1,
        aspectRatio:    '4 / 3',
        background:     '#0a0a12',
        border:         `1px solid ${offline ? 'rgba(255,255,255,0.04)' : 'var(--color-border)'}`,
        borderRadius:   'var(--radius-md, 8px)',
        overflow:       'hidden',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        minHeight:      80,
      }}
    >
      {/* ── Live video stream ───────────────────────────────── */}
      {videoRef && !camOff && !offline && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            position:   'absolute',
            inset:       0,
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            display:    'block',
          }}
        />
      )}

      {/* ── Avatar fallback (cam off / no stream) ───────────── */}
      {(camOff || !videoRef) && !offline && (
        <div
          style={{
            width:          48,
            height:         48,
            borderRadius:   '50%',
            background:     color + '25',
            border:         `1px solid ${color}50`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontFamily:     'var(--font-ui, Inter, sans-serif)',
            fontSize:       '1.1rem',
            fontWeight:     600,
            color:           color,
            userSelect:     'none',
          }}
        >
          {initials}
        </div>
      )}

      {/* ── Speaking pulse ring ──────────────────────────────── */}
      {speaking && !offline && (
        <motion.div
          animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0.12, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          style={{
            position:      'absolute',
            width:          64,
            height:         64,
            borderRadius:  '50%',
            border:         `2px solid ${color}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Name tag ─────────────────────────────────────────── */}
      {!offline && (
        <div
          style={{
            position:    'absolute',
            bottom:       5,
            left:         6,
            display:     'flex',
            alignItems:  'center',
            gap:          5,
          }}
        >
          {/* Speaking dot */}
          {speaking && (
            <motion.span
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                width:        5,
                height:       5,
                borderRadius: '50%',
                background:   color,
                flexShrink:   0,
                display:      'block',
              }}
            />
          )}

          {/* Name pill — font: Inter */}
          <span
            style={{
              fontFamily:     'var(--font-ui, Inter, sans-serif)',
              fontSize:       '0.62rem',
              fontWeight:     500,
              color:          '#e0e0ff',
              background:     'rgba(0,0,0,0.62)',
              padding:        '1px 6px',
              borderRadius:   'var(--radius-full, 9999px)',
              backdropFilter: 'blur(4px)',
              whiteSpace:     'nowrap',
              maxWidth:        90,
              overflow:       'hidden',
              textOverflow:   'ellipsis',
            }}
          >
            {isLocal ? 'You' : name}
          </span>
        </div>
      )}

      {/* ── Muted indicator ──────────────────────────────────── */}
      {muted && !offline && (
        <div
          style={{
            position:     'absolute',
            top:           5,
            right:         5,
            background:   'rgba(248,113,113,0.92)',
            borderRadius: 'var(--radius-full, 9999px)',
            padding:      '2px 3px',
            display:      'flex',
            alignItems:   'center',
            color:        '#fff',
          }}
        >
          <MicOffIcon />
        </div>
      )}

      {/* ── Offline overlay ──────────────────────────────────── */}
      {offline && (
        <div
          style={{
            position:       'absolute',
            inset:           0,
            background:     'rgba(13,13,16,0.68)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:             6,
          }}
        >
          {/* Avatar in grayscale */}
          <div
            style={{
              width:          36,
              height:         36,
              borderRadius:  '50%',
              background:     color + '18',
              border:         `1.5px solid ${color}30`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontFamily:     'var(--font-ui, Inter, sans-serif)',
              fontSize:       '0.9rem',
              fontWeight:     600,
              color:           color + '55',
              userSelect:     'none',
            }}
          >
            {initials}
          </div>
          <span
            style={{
              fontFamily:    'var(--font-ui, Inter, sans-serif)',
              fontSize:      '0.6rem',
              color:         'var(--color-text-hint, rgba(255,255,255,0.3))',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            offline
          </span>
        </div>
      )}
    </motion.div>
  )
}
