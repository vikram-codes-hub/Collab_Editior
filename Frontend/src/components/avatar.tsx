import { motion } from 'framer-motion'

/* ============================================================
   Avatar — font: Inter (--font-ui) for initials
   Sizes: sm (24px) | md (32px) | lg (40px) | xl (56px)
   ============================================================ */

const USER_COLORS = [
  { bg: 'rgba(167,139,250,0.18)', text: '#a78bfa', border: 'rgba(167,139,250,0.35)' }, // violet
  { bg: 'rgba(251,146,60,0.18)',  text: '#fb923c', border: 'rgba(251,146,60,0.35)'  }, // orange
  { bg: 'rgba(52,211,153,0.18)',  text: '#34d399', border: 'rgba(52,211,153,0.35)'  }, // green
  { bg: 'rgba(244,114,182,0.18)', text: '#f472b6', border: 'rgba(244,114,182,0.35)' }, // pink
  { bg: 'rgba(251,191,36,0.18)',  text: '#fbbf24', border: 'rgba(251,191,36,0.35)'  }, // amber
  { bg: 'rgba(96,165,250,0.18)',  text: '#60a5fa', border: 'rgba(96,165,250,0.35)'  }, // blue
]

const SIZE_MAP = {
  sm: { box: 24, font: 9,  dot: 7,  dotOffset: -1 },
  md: { box: 32, font: 11, dot: 8,  dotOffset: -1 },
  lg: { box: 40, font: 14, dot: 9,  dotOffset: 0  },
  xl: { box: 56, font: 20, dot: 11, dotOffset: 1  },
}

type AvatarSize   = 'sm' | 'md' | 'lg' | 'xl'
type OnlineStatus = 'online' | 'away' | 'offline'

interface AvatarProps {
  name:      string
  size?:     AvatarSize
  colorIdx?: number           // 0-5, auto-derived from name if omitted
  status?:   OnlineStatus     // shows presence dot if provided
  src?:      string           // image url — falls back to initials
  onClick?:  () => void
  className?: string
  style?:    React.CSSProperties
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorIdx(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % USER_COLORS.length
}

const STATUS_COLOR: Record<OnlineStatus, string> = {
  online:  'var(--color-success)',
  away:    'var(--color-warning)',
  offline: 'var(--color-text-muted)',
}

export default function Avatar({
  name,
  size      = 'md',
  colorIdx,
  status,
  src,
  onClick,
  className = '',
  style,
}: AvatarProps) {
  const s      = SIZE_MAP[size]
  const idx    = colorIdx ?? getColorIdx(name)
  const colors = USER_COLORS[idx % USER_COLORS.length]

  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { scale: 1.08 } : undefined}
      whileTap={onClick  ? { scale: 0.94 } : undefined}
      transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
      className={className}
      style={{
        position:      'relative',
        display:       'inline-flex',
        flexShrink:    0,
        cursor:        onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* ── Avatar circle ── */}
      <div
        style={{
          width:          s.box,
          height:         s.box,
          borderRadius:   '50%',
          background:     src ? 'transparent' : colors.bg,
          border:         `1px solid ${colors.border}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          overflow:       'hidden',
          flexShrink:     0,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontFamily:  'var(--font-ui)',       /* Inter */
              fontSize:    s.font,
              fontWeight:  600,
              color:       colors.text,
              lineHeight:  1,
              userSelect:  'none',
              letterSpacing: '-0.02em',
            }}
          >
            {getInitials(name)}
          </span>
        )}
      </div>

      {/* ── Presence dot ── */}
      {status && (
        <span
          style={{
            position:     'absolute',
            bottom:       s.dotOffset,
            right:        s.dotOffset,
            width:        s.dot,
            height:       s.dot,
            borderRadius: '50%',
            background:   STATUS_COLOR[status],
            border:       '1.5px solid var(--color-surface)',
            flexShrink:   0,
          }}
        />
      )}
    </motion.div>
  )
}

/* ============================================================
   AvatarGroup — stacked avatars with +N overflow
   font: Inter (--font-ui) for the +N label
   ============================================================ */

interface AvatarGroupProps {
  users:   { name: string; src?: string; colorIdx?: number }[]
  max?:    number
  size?:   AvatarSize
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible  = users.slice(0, max)
  const overflow = users.length - max
  const s        = SIZE_MAP[size]
  const overlap  = Math.round(s.box * 0.35)

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((u, i) => (
        <motion.div
          key={u.name + i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1,  x: 0  }}
          transition={{ delay: i * 0.05, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            zIndex:     visible.length - i,
          }}
        >
          <Avatar
            name={u.name}
            src={u.src}
            size={size}
            colorIdx={u.colorIdx}
            style={{ boxShadow: '0 0 0 2px var(--color-surface)' }}
          />
        </motion.div>
      ))}

      {overflow > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1,  scale: 1   }}
          transition={{ delay: visible.length * 0.05, duration: 0.2 }}
          style={{
            marginLeft:     -overlap,
            width:          s.box,
            height:         s.box,
            borderRadius:   '50%',
            background:     'var(--color-elevated)',
            border:         '1px solid var(--color-border-md)',
            boxShadow:      '0 0 0 2px var(--color-surface)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui)',    /* Inter */
              fontSize:   s.font - 1,
              fontWeight: 600,
              color:      'var(--color-text-muted)',
            }}
          >
            +{overflow}
          </span>
        </motion.div>
      )}
    </div>
  )
}