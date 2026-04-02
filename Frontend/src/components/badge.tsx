import { motion } from 'framer-motion'

/* ============================================================
   Badge — font: Inter (--font-ui) — small UI labels
   Variants: accent | success | warning | danger | info | ghost
   ============================================================ */

type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'ghost'

interface BadgeProps {
  children:  React.ReactNode
  variant?:  BadgeVariant
  dot?:      boolean        
  pulse?:    boolean         
  icon?:     React.ReactNode 
  onRemove?: () => void      
  className?: string
  style?:    React.CSSProperties
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  accent:  { background: 'var(--color-accent-dim)',  color: 'var(--color-accent-light)' },
  success: { background: 'var(--color-success-dim)', color: 'var(--color-success)'      },
  warning: { background: 'var(--color-warning-dim)', color: 'var(--color-warning)'      },
  danger:  { background: 'var(--color-danger-dim)',  color: 'var(--color-danger)'       },
  info:    { background: 'var(--color-info-dim)',    color: 'var(--color-info)'         },
  ghost:   {
    background:  'rgba(255,255,255,0.05)',
    color:       'var(--color-text-muted)',
    border:      '1px solid var(--color-border)',
  },
}

const DOT_COLOR: Record<BadgeVariant, string> = {
  accent:  'var(--color-accent-light)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger:  'var(--color-danger)',
  info:    'var(--color-info)',
  ghost:   'var(--color-text-muted)',
}

export default function Badge({
  children,
  variant   = 'accent',
  dot       = false,
  pulse     = false,
  icon,
  onRemove,
  className = '',
  style,
}: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           4,
        fontFamily:    'var(--font-ui)',    /* Inter */
        fontSize:      '0.6875rem',
        fontWeight:    500,
        padding:       '2px 8px',
        borderRadius:  'var(--radius-full)',
        whiteSpace:    'nowrap',
        lineHeight:    1.6,
        ...VARIANT_STYLES[variant],
        ...style,
      }}
    >
      {/* Dot indicator */}
      {dot && (
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          {pulse && (
            <span
              style={{
                position:     'absolute',
                inset:        0,
                borderRadius: '50%',
                background:   DOT_COLOR[variant],
                opacity:      0.4,
                animation:    'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
              }}
            />
          )}
          <span
            style={{
              width:        6,
              height:       6,
              borderRadius: '50%',
              background:   DOT_COLOR[variant],
              flexShrink:   0,
              display:      'block',
            }}
          />
          <style>{`
            @keyframes ping {
              75%, 100% { transform: scale(2); opacity: 0; }
            }
          `}</style>
        </span>
      )}

      {/* Optional icon */}
      {icon && (
        <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.85 }}>
          {icon}
        </span>
      )}

      {children}

      {/* Remove button */}
      {onRemove && (
        <motion.button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            justifyContent: 'center',
            background:     'none',
            border:         'none',
            cursor:         'pointer',
            color:          'inherit',
            opacity:        0.6,
            padding:        0,
            marginLeft:     2,
            lineHeight:     1,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </motion.button>
      )}
    </span>
  )
}

/* ============================================================
   LanguageBadge — shows language with a color dot
   font: JetBrains Mono (--font-code) for the language name
   ============================================================ */

const LANG_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python:     '#3572a5',
  rust:       '#ce4a00',
  go:         '#00acd7',
  cpp:        '#f34b7d',
  java:       '#b07219',
  html:       '#e44b23',
  css:        '#563d7c',
  json:       '#40a977',
  markdown:   '#083fa1',
  shell:      '#89e051',
}

interface LanguageBadgeProps {
  language: string
}

export function LanguageBadge({ language }: LanguageBadgeProps) {
  const key   = language.toLowerCase()
  const color = LANG_COLORS[key] ?? 'var(--color-text-muted)'

  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          5,
        fontFamily:   'var(--font-code)',   /* JetBrains Mono — language name */
        fontSize:     '0.6875rem',
        fontWeight:   400,
        color:        'var(--color-text-secondary)',
        background:   'var(--color-elevated)',
        border:       '1px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        padding:      '2px 8px',
        whiteSpace:   'nowrap',
      }}
    >
      <span
        style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   color,
          flexShrink:   0,
        }}
      />
      {language}
    </span>
  )
}

/* ============================================================
   UserCountBadge — shows number of online users
   font: Inter (--font-ui)
   ============================================================ */

interface UserCountBadgeProps {
  count: number
}

export function UserCountBadge({ count }: UserCountBadgeProps) {
  return (
    <Badge variant="success" dot pulse={count > 0}>
      {count} online
    </Badge>
  )
}