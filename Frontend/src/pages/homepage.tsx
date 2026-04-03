import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AvatarGroup } from '../components/Avatar'
import Badge, { LanguageBadge, UserCountBadge } from '../components/Badge'

/* ============================================================
   Homepage — Room list + Create room modal
   font: Syne      → "depot" logo, page greeting heading
   font: Manrope   → descriptions, meta text, empty state
   font: Inter     → all UI chrome (buttons, inputs, labels,
                      room names, badges, search)
   font: JetBrains → room id chip, language tag
   ============================================================ */

/* ── Mock data ──────────────────────────────────────────────── */
const MOCK_USER = { name: 'Alex Rivera', email: 'alex@depot.dev' }

const MOCK_ROOMS = [
  {
    id: 'rm_01',
    name: 'API Refactor',
    language: 'TypeScript',
    description: 'Cleaning up the auth service endpoints and adding proper error handling',
    members: [
      { name: 'Alex Rivera' },
      { name: 'Sam Okonkwo' },
      { name: 'Priya Nair' },
    ],
    onlineCount: 3,
    lastActive: '2 min ago',
    createdAt: '2024-01-15',
  },
  {
    id: 'rm_02',
    name: 'Dashboard UI',
    language: 'React',
    description: 'Building the analytics dashboard with recharts and Tailwind',
    members: [
      { name: 'Jordan Lee' },
      { name: 'Maya Chen' },
    ],
    onlineCount: 1,
    lastActive: '18 min ago',
    createdAt: '2024-01-14',
  },
  {
    id: 'rm_03',
    name: 'ML Pipeline',
    language: 'Python',
    description: 'Data preprocessing and model training scripts for the recommendation engine',
    members: [
      { name: 'Finn Walsh' },
      { name: 'Zara Ahmed' },
      { name: 'Leo Park' },
      { name: 'Nina Russo' },
      { name: 'Omar Diallo' },
    ],
    onlineCount: 0,
    lastActive: '3 hours ago',
    createdAt: '2024-01-12',
  },
  {
    id: 'rm_04',
    name: 'Auth Service',
    language: 'Go',
    description: 'JWT implementation and OAuth2 provider integration',
    members: [
      { name: 'Sam Okonkwo' },
      { name: 'Priya Nair' },
    ],
    onlineCount: 2,
    lastActive: '45 min ago',
    createdAt: '2024-01-11',
  },
  {
    id: 'rm_05',
    name: 'Mobile App',
    language: 'TypeScript',
    description: 'React Native screens for the iOS and Android client',
    members: [
      { name: 'Maya Chen' },
    ],
    onlineCount: 0,
    lastActive: 'Yesterday',
    createdAt: '2024-01-10',
  },
]

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust',
  'Java', 'C++', 'HTML', 'CSS', 'Shell', 'Markdown',
]

/* ── Icons ──────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M5.5 3v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <circle cx="4" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M1 9.5c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <circle cx="8.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M10.5 9.5c0-1.1-.9-2-2-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
)

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M4 3.5h8M4 7h8M4 10.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="1.5" cy="3.5" r="1" fill="currentColor"/>
    <circle cx="1.5" cy="7"   r="1" fill="currentColor"/>
    <circle cx="1.5" cy="10.5" r="1" fill="currentColor"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
    style={{ animation: 'spin 0.7s linear infinite' }}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" opacity="0.8"/>
  </svg>
)

/* ── Room card ──────────────────────────────────────────────── */
interface Room {
  id: string
  name: string
  language: string
  description: string
  members: { name: string }[]
  onlineCount: number
  lastActive: string
  createdAt: string
}

interface RoomCardProps {
  room:  Room
  index: number
  view:  'grid' | 'list'
  onClick: () => void
}

function RoomCard({ room, index, view, onClick }: RoomCardProps) {
  const [hovered, setHovered] = useState(false)

  const isGrid = view === 'grid'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      style={{
        background:   hovered ? 'var(--color-hover)' : 'var(--color-surface)',
        border:       `1px solid ${hovered ? 'var(--color-border-md)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding:      isGrid ? '1.125rem' : '0.875rem 1.125rem',
        cursor:       'pointer',
        display:      'flex',
        flexDirection: isGrid ? 'column' : 'row',
        alignItems:   isGrid ? 'flex-start' : 'center',
        gap:          isGrid ? '0.75rem' : '1rem',
        transition:   'background 150ms ease, border-color 150ms ease',
        position:     'relative',
        overflow:     'hidden',
      }}
    >
      {/* Online indicator stripe */}
      {room.onlineCount > 0 && (
        <div style={{
          position:     'absolute',
          left:         0,
          top:          '20%',
          bottom:       '20%',
          width:        2,
          background:   'var(--color-accent)',
          borderRadius: '0 2px 2px 0',
        }}/>
      )}

      {/* Top row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        width:          '100%',
        gap:            8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {/* Room name — font: Inter */}
          <span style={{
            fontFamily:   'var(--font-ui)',
            fontSize:     '0.875rem',
            fontWeight:   500,
            color:        'var(--color-text-primary)',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {room.name}
          </span>
          {room.onlineCount > 0 && (
            <span style={{
              width:        6,
              height:       6,
              borderRadius: '50%',
              background:   'var(--color-success)',
              flexShrink:   0,
            }}/>
          )}
        </div>
        <LanguageBadge language={room.language} />
      </div>

      {/* Description — font: Manrope */}
      {isGrid && (
        <p style={{
          fontFamily:   'var(--font-body)',
          fontSize:     '0.775rem',
          color:        'var(--color-text-muted)',
          lineHeight:   1.65,
          display:      '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow:     'hidden',
          margin:       0,
        }}>
          {room.description}
        </p>
      )}

      {/* Bottom row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        width:          '100%',
        marginTop:      isGrid ? 'auto' : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AvatarGroup users={room.members} max={3} size="sm" />
          {/* Meta — font: Inter */}
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize:   '0.7rem',
            color:      'var(--color-text-muted)',
            display:    'flex',
            alignItems: 'center',
            gap:        4,
          }}>
            <UsersIcon />
            {room.members.length}
          </span>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize:   '0.7rem',
            color:      'var(--color-text-muted)',
            display:    'flex',
            alignItems: 'center',
            gap:        4,
          }}>
            <ClockIcon />
            {room.lastActive}
          </span>
        </div>

        {/* Arrow on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -4 }}
          transition={{ duration: 0.15 }}
          style={{ color: 'var(--color-accent-light)', display: 'flex' }}
        >
          <ArrowRightIcon />
        </motion.div>
      </div>

      {/* Room ID chip — font: JetBrains Mono */}
      {isGrid && (
        <span style={{
          fontFamily:   'var(--font-code)',
          fontSize:     '0.625rem',
          color:        'var(--color-text-hint)',
          letterSpacing:'0.04em',
        }}>
          {room.id}
        </span>
      )}
    </motion.div>
  )
}

/* ── Create room modal ──────────────────────────────────────── */
interface CreateRoomModalProps {
  onClose:  () => void
  onCreate: (name: string, language: string) => void
}

function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const [name,     setName]     = useState('')
  const [language, setLanguage] = useState('TypeScript')
  const [loading,  setLoading]  = useState(false)
  const [nameErr,  setNameErr]  = useState('')

  const handleCreate = async () => {
    if (!name.trim() || name.length < 2) {
      setNameErr('Room name must be at least 2 characters')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 600)) // mock delay
    onCreate(name.trim(), language)
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         100,
        padding:        '1rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1,  scale: 1,    y: 0  }}
        exit={{ opacity: 0,    scale: 0.95, y: 8  }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background:   'var(--color-surface)',
          border:       '1px solid var(--color-border-md)',
          borderRadius: 'var(--radius-xl)',
          padding:      '1.75rem',
          width:        '100%',
          maxWidth:     440,
          boxShadow:    'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            {/* font: Syne */}
            <h2 style={{
              fontFamily:    'var(--font-heading)',
              fontSize:      '1.25rem',
              fontWeight:    700,
              color:         'var(--color-text-primary)',
              marginBottom:  4,
              letterSpacing: '-0.02em',
            }}>
              New room
            </h2>
            {/* font: Manrope */}
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize:   '0.775rem',
              color:      'var(--color-text-muted)',
              margin:     0,
            }}>
              Create a shared space to write code together
            </p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ background: 'var(--color-hover)' }}
            whileTap={{ scale: 0.9 }}
            style={{
              background:   'none',
              border:       '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color:        'var(--color-text-muted)',
              cursor:       'pointer',
              padding:      6,
              display:      'flex',
            }}
          >
            <CloseIcon />
          </motion.button>
        </div>

        {/* Room name — font: Inter for label + input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            fontFamily:    'var(--font-ui)',
            fontSize:      '0.75rem',
            fontWeight:    500,
            color:         nameErr ? 'var(--color-danger)' : 'var(--color-text-secondary)',
            display:       'block',
            marginBottom:  6,
            letterSpacing: '0.01em',
          }}>
            Room name
          </label>
          <input
            autoFocus
            value={name}
            onChange={e => { setName(e.target.value); setNameErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. API Refactor, Auth Service"
            maxLength={60}
            style={{
              width:        '100%',
              background:   'var(--color-elevated)',
              border:       `1px solid ${nameErr ? 'var(--color-danger)' : 'var(--color-border-md)'}`,
              borderRadius: 'var(--radius-sm)',
              color:        'var(--color-text-primary)',
              fontFamily:   'var(--font-ui)',
              fontSize:     '0.8125rem',
              padding:      '0.6rem 0.75rem',
              outline:      'none',
              boxShadow:    nameErr ? '0 0 0 3px var(--color-danger-dim)' : 'none',
              transition:   'border-color 150ms ease, box-shadow 150ms ease',
            }}
            onFocus={e => {
              e.target.style.borderColor = nameErr ? 'var(--color-danger)' : 'var(--color-accent)'
              e.target.style.boxShadow   = nameErr ? '0 0 0 3px var(--color-danger-dim)' : '0 0 0 3px var(--color-accent-dim)'
            }}
            onBlur={e => {
              e.target.style.borderColor = nameErr ? 'var(--color-danger)' : 'var(--color-border-md)'
              e.target.style.boxShadow   = nameErr ? '0 0 0 3px var(--color-danger-dim)' : 'none'
            }}
          />
          <AnimatePresence>
            {nameErr && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1,  y: 0  }}
                exit={{ opacity: 0 }}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   '0.7rem',
                  color:      'var(--color-danger)',
                  display:    'block',
                  marginTop:  5,
                }}
              >
                {nameErr}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Language picker — font: Inter label, JetBrains for options */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            fontFamily:   'var(--font-ui)',
            fontSize:     '0.75rem',
            fontWeight:   500,
            color:        'var(--color-text-secondary)',
            display:      'block',
            marginBottom: 8,
            letterSpacing:'0.01em',
          }}>
            Language
          </label>
          <div style={{
            display:   'flex',
            flexWrap:  'wrap',
            gap:       6,
          }}>
            {LANGUAGES.map(lang => (
              <motion.button
                key={lang}
                onClick={() => setLanguage(lang)}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontFamily:   'var(--font-code)',   /* JetBrains Mono — language names */
                  fontSize:     '0.7rem',
                  padding:      '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border:       `1px solid ${language === lang ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background:   language === lang ? 'var(--color-accent-dim)' : 'transparent',
                  color:        language === lang ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                  cursor:       'pointer',
                  transition:   'all 150ms ease',
                }}
              >
                {lang}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <motion.button
            onClick={onClose}
            whileHover={{ background: 'var(--color-hover)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily:   'var(--font-ui)',
              fontSize:     '0.8125rem',
              fontWeight:   500,
              color:        'var(--color-text-secondary)',
              background:   'transparent',
              border:       '1px solid var(--color-border-md)',
              borderRadius: 'var(--radius-sm)',
              padding:      '0.5rem 1rem',
              cursor:       'pointer',
              transition:   'background 150ms ease',
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleCreate}
            disabled={loading}
            whileHover={!loading ? { boxShadow: '0 0 20px var(--color-accent-glow)' } : undefined}
            whileTap={!loading  ? { scale: 0.97 } : undefined}
            style={{
              fontFamily:     'var(--font-ui)',
              fontSize:       '0.8125rem',
              fontWeight:     500,
              color:          '#fff',
              background:     'var(--color-accent)',
              border:         'none',
              borderRadius:   'var(--radius-sm)',
              padding:        '0.5rem 1.25rem',
              cursor:         loading ? 'not-allowed' : 'pointer',
              opacity:        loading ? 0.7 : 1,
              display:        'flex',
              alignItems:     'center',
              gap:            6,
              transition:     'opacity 150ms ease',
            }}
          >
            {loading ? <SpinnerIcon /> : <PlusIcon />}
            {loading ? 'Creating…' : 'Create room'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Empty state ────────────────────────────────────────────── */
function EmptyState({ onCreateRoom }: { onCreateRoom: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '5rem 2rem',
        textAlign:      'center',
        gap:            '1rem',
      }}
    >
      {/* Decorative icon */}
      <div style={{
        width:        56,
        height:       56,
        borderRadius: 'var(--radius-lg)',
        background:   'var(--color-elevated)',
        border:       '1px solid var(--color-border)',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        marginBottom: 4,
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.3"/>
          <rect x="12" y="2" width="8" height="8" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.3"/>
          <rect x="2" y="12" width="8" height="8" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.3"/>
          <rect x="12" y="12" width="8" height="8" rx="2" stroke="var(--color-accent)" strokeWidth="1.3"/>
          <path d="M16 14v4M14 16h4" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>

      {/* font: Syne */}
      <h3 style={{
        fontFamily:    'var(--font-heading)',
        fontSize:      '1.1rem',
        fontWeight:    700,
        color:         'var(--color-text-primary)',
        letterSpacing: '-0.01em',
      }}>
        No rooms yet
      </h3>

      {/* font: Manrope */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize:   '0.825rem',
        color:      'var(--color-text-muted)',
        maxWidth:   300,
        lineHeight: 1.65,
        margin:     0,
      }}>
        Create your first room and invite your team to start coding together in real time.
      </p>

      <motion.button
        onClick={onCreateRoom}
        whileHover={{ scale: 1.03, boxShadow: '0 0 20px var(--color-accent-glow)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          fontFamily:   'var(--font-ui)',
          fontSize:     '0.8125rem',
          fontWeight:   500,
          background:   'var(--color-accent)',
          color:        '#fff',
          border:       'none',
          borderRadius: 'var(--radius-sm)',
          padding:      '0.6rem 1.25rem',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          marginTop:    4,
        }}
      >
        <PlusIcon />
        Create your first room
      </motion.button>
    </motion.div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate()

  const [rooms,       setRooms]       = useState(MOCK_ROOMS)
  const [showModal,   setShowModal]   = useState(false)
  const [search,      setSearch]      = useState('')
  const [view,        setView]        = useState<'grid' | 'list'>('grid')
  const [filterLang,  setFilterLang]  = useState<string>('all')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  /* Filter + search */
  const filtered = useMemo(() => {
    return rooms.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                          r.description.toLowerCase().includes(search.toLowerCase())
      const matchLang   = filterLang === 'all' || r.language === filterLang
      return matchSearch && matchLang
    })
  }, [rooms, search, filterLang])

  const allLangs = ['all', ...Array.from(new Set(rooms.map(r => r.language)))]

  const handleCreate = (name: string, language: string) => {
    const newRoom = {
      id:          `rm_0${rooms.length + 1}`,
      name,
      language,
      description: 'A new collaborative coding room',
      members:     [{ name: MOCK_USER.name }],
      onlineCount: 1,
      lastActive:  'just now',
      createdAt:   new Date().toISOString(),
    }
    setRooms(prev => [newRoom, ...prev])
    setShowModal(false)
    navigate(`/room/${newRoom.id}`)
  }

  const onlineTotal = rooms.reduce((sum, r) => sum + r.onlineCount, 0)

  return (
    <div style={{
      minHeight:  '100vh',
      background: 'var(--color-app)',
      display:    'flex',
      flexDirection: 'column',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Topbar ── */}
      <header style={{
        height:       44,
        borderBottom: '1px solid var(--color-border)',
        background:   'var(--color-surface)',
        display:      'flex',
        alignItems:   'center',
        padding:      '0 1.5rem',
        gap:          12,
        flexShrink:   0,
        position:     'sticky',
        top:          0,
        zIndex:       20,
      }}>
        {/* Logo — font: Syne */}
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1,  x: 0  }}
          style={{
            fontFamily:    'var(--font-heading)',
            fontSize:      '1rem',
            fontWeight:    800,
            color:         'var(--color-text-primary)',
            letterSpacing: '-0.03em',
            marginRight:   8,
          }}
        >
          depot
        </motion.span>

        <div style={{ flex: 1 }}/>

        {/* Online count */}
        {onlineTotal > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <UserCountBadge count={onlineTotal} />
          </motion.div>
        )}

        {/* User avatar — using initials */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1,  scale: 1   }}
          transition={{ delay: 0.2 }}
          style={{
            width:          30,
            height:         30,
            borderRadius:   '50%',
            background:     'var(--color-accent-dim)',
            border:         '1px solid rgba(124,111,247,0.3)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontFamily:     'var(--font-ui)',
            fontSize:       '0.7rem',
            fontWeight:     600,
            color:          'var(--color-accent-light)',
            cursor:         'pointer',
          }}
        >
          {MOCK_USER.name.split(' ').map(n => n[0]).join('')}
        </motion.div>
      </header>

      {/* ── Main content ── */}
      <main style={{
        flex:      1,
        maxWidth:  900,
        width:     '100%',
        margin:    '0 auto',
        padding:   '2.5rem 1.5rem',
      }}>

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1,  y: 0  }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: '2rem' }}
        >
          {/* font: Syne */}
          <h1 style={{
            fontFamily:    'var(--font-heading)',
            fontSize:      'clamp(1.5rem, 4vw, 2rem)',
            fontWeight:    800,
            color:         'var(--color-text-primary)',
            letterSpacing: '-0.03em',
            marginBottom:  6,
          }}>
            {greeting}, {MOCK_USER.name.split(' ')[0]}
          </h1>
          {/* font: Manrope */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize:   '0.875rem',
            color:      'var(--color-text-muted)',
            margin:     0,
          }}>
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} in your workspace
            {onlineTotal > 0 && ` · ${onlineTotal} collaborator${onlineTotal !== 1 ? 's' : ''} online`}
          </p>
        </motion.div>

        {/* ── Controls bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1,  y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            10,
            marginBottom:   '1.25rem',
            flexWrap:       'wrap',
          }}
        >
          {/* Search — font: Inter */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{
              position:  'absolute',
              left:      10,
              top:       '50%',
              transform: 'translateY(-50%)',
              color:     'var(--color-text-muted)',
              display:   'flex',
              pointerEvents: 'none',
            }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rooms…"
              style={{
                width:        '100%',
                background:   'var(--color-surface)',
                border:       '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color:        'var(--color-text-primary)',
                fontFamily:   'var(--font-ui)',
                fontSize:     '0.8125rem',
                padding:      '0.45rem 0.75rem 0.45rem 2rem',
                outline:      'none',
                transition:   'border-color 150ms ease, box-shadow 150ms ease',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px var(--color-accent-dim)' }}
              onBlur={e  => { e.target.style.borderColor = 'var(--color-border)';  e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Language filter — font: Inter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {allLangs.map(lang => (
              <motion.button
                key={lang}
                onClick={() => setFilterLang(lang)}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontFamily:   'var(--font-ui)',
                  fontSize:     '0.725rem',
                  fontWeight:   500,
                  padding:      '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border:       `1px solid ${filterLang === lang ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background:   filterLang === lang ? 'var(--color-accent-dim)' : 'transparent',
                  color:        filterLang === lang ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                  cursor:       'pointer',
                  transition:   'all 150ms ease',
                  whiteSpace:   'nowrap',
                }}
              >
                {lang === 'all' ? 'All' : lang}
              </motion.button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{
            display:      'flex',
            background:   'var(--color-surface)',
            border:       '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding:      2,
            gap:          2,
          }}>
            {(['grid', 'list'] as const).map(v => (
              <motion.button
                key={v}
                onClick={() => setView(v)}
                whileTap={{ scale: 0.9 }}
                style={{
                  background:   view === v ? 'var(--color-elevated)' : 'transparent',
                  border:       'none',
                  borderRadius: 4,
                  color:        view === v ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  padding:      '5px 7px',
                  cursor:       'pointer',
                  display:      'flex',
                  transition:   'all 150ms ease',
                }}
              >
                {v === 'grid' ? <GridIcon /> : <ListIcon />}
              </motion.button>
            ))}
          </div>

          {/* Create button — font: Inter */}
          <motion.button
            onClick={() => setShowModal(true)}
            whileHover={{ boxShadow: '0 0 16px var(--color-accent-glow)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily:   'var(--font-ui)',
              fontSize:     '0.8125rem',
              fontWeight:   500,
              background:   'var(--color-accent)',
              color:        '#fff',
              border:       'none',
              borderRadius: 'var(--radius-sm)',
              padding:      '0.45rem 1rem',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              whiteSpace:   'nowrap',
              flexShrink:   0,
            }}
          >
            <PlusIcon />
            New room
          </motion.button>
        </motion.div>

        {/* ── Room grid / list ── */}
        {filtered.length === 0 && search ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign:  'center',
              padding:    '3rem',
              fontFamily: 'var(--font-body)',
              fontSize:   '0.85rem',
              color:      'var(--color-text-muted)',
            }}
          >
            No rooms match <strong style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>"{search}"</strong>
          </motion.div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreateRoom={() => setShowModal(true)} />
        ) : (
          <motion.div
            layout
            style={{
              display:             'grid',
              gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr',
              gap:                 view === 'grid' ? '0.875rem' : '0.5rem',
            }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={i}
                  view={view}
                  onClick={() => navigate(`/room/${room.id}`)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* ── Create room modal ── */}
      <AnimatePresence>
        {showModal && (
          <CreateRoomModal
            onClose={() => setShowModal(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}