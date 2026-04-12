// homepage.tsx — wired to real stores + API
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AvatarGroup } from '../components/avatar'
import { LanguageBadge, UserCountBadge } from '../components/badge'
import Modal from '../components/modal'
import Tooltip from '../components/tooltip'
import LoadingScreen from '../components/loadingscreen'
import useAuthStore  from '../store/authstore'
import useRoomStore  from '../store/roomstore'
import useUIStore    from '../store/uiStore'
import { Room }      from '../types'

const LANGUAGES = ['JavaScript','TypeScript','Python','Go','Rust','Java','C++','HTML','CSS','Shell','Markdown']

/* ── Icons ────────────────────────────────────────────────── */
const PlusIcon    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
const SearchIcon  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/><path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const ClockIcon   = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/><path d="M5.5 3v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
const UsersIcon   = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="4" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.1"/><path d="M1 9.5c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><circle cx="8.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M10.5 9.5c0-1.1-.9-2-2-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
const GridIcon    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
const ListIcon    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 3.5h8M4 7h8M4 10.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="1.5" cy="3.5" r="1" fill="currentColor"/><circle cx="1.5" cy="7" r="1" fill="currentColor"/><circle cx="1.5" cy="10.5" r="1" fill="currentColor"/></svg>
const ArrowRight  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
const SpinnerIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" opacity="0.8"/></svg>
const LogoutIcon  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h2M9 9.5l3-3-3-3M12 6.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>

/* ── Room card ────────────────────────────────────────────── */
function RoomCard({ room, index, view, onClick }: {
  room: Room; index: number; view: 'grid'|'list'; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isGrid = view === 'grid'

  // Build members array for AvatarGroup
  const members = room.members?.map(m => ({ name: m.username })) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.16,1,0.3,1] }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      whileHover={{ y: isGrid ? -2 : 0 }}
      style={{
        background: hovered ? 'var(--color-hover)' : 'var(--color-surface)',
        border: `1px solid ${hovered ? 'var(--color-border-md)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: isGrid ? '1rem' : '0.75rem 1rem',
        cursor: 'pointer', display: 'flex',
        flexDirection: isGrid ? 'column' : 'row',
        alignItems: isGrid ? 'flex-start' : 'center',
        gap: isGrid ? '0.65rem' : '0.875rem',
        transition: 'background 150ms ease, border-color 150ms ease',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Online stripe */}
      {(room.online_count ?? 0) > 0 && (
        <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 2, background: 'var(--color-accent)', borderRadius: '0 2px 2px 0' }}/>
      )}

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.name}
          </span>
          {(room.online_count ?? 0) > 0 && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }}/>
          )}
        </div>
        <LanguageBadge language={room.language} />
      </div>

      {/* Description — grid only */}
      {isGrid && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.775rem', color: 'var(--color-text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
          {room.name} — {room.language} room
        </p>
      )}

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: isGrid ? 'auto' : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {members.length > 0 && <AvatarGroup users={members} max={3} size="sm" />}
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <UsersIcon />{room.member_count ?? members.length}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <ClockIcon />{new Date(room.created_at).toLocaleDateString()}
          </span>
        </div>
        <motion.div animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -4 }} style={{ color: 'var(--color-accent-light)', display: 'flex' }}>
          <ArrowRight />
        </motion.div>
      </div>

      {/* Room ID chip */}
      {isGrid && (
        <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.6rem', color: 'var(--color-text-hint)', letterSpacing: '0.04em' }}>
          {room.id.slice(0, 8)}…
        </span>
      )}
    </motion.div>
  )
}

/* ── Create room body ─────────────────────────────────────── */
function CreateRoomBody({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (n: string, l: string) => Promise<void>
}) {
  const [name,     setName]    = useState('')
  const [language, setLang]    = useState('TypeScript')
  const [loading,  setLoading] = useState(false)
  const [nameErr,  setNameErr] = useState('')

  const handleCreate = async () => {
    if (!name.trim() || name.length < 2) { setNameErr('At least 2 characters'); return }
    setLoading(true)
    try {
      await onCreate(name.trim(), language)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 500, color: nameErr ? 'var(--color-danger)' : 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
          Room name
        </label>
        <input
          autoFocus value={name}
          onChange={e => { setName(e.target.value); setNameErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. API Refactor, Auth Service" maxLength={60}
          style={{ width: '100%', background: 'var(--color-elevated)', border: `1px solid ${nameErr ? 'var(--color-danger)' : 'var(--color-border-md)'}`, borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', padding: '0.6rem 0.75rem', outline: 'none', transition: 'border-color 150ms ease, box-shadow 150ms ease' }}
          onFocus={e => { e.target.style.borderColor='var(--color-accent)'; e.target.style.boxShadow='0 0 0 3px var(--color-accent-dim)' }}
          onBlur={e  => { e.target.style.borderColor=nameErr?'var(--color-danger)':'var(--color-border-md)'; e.target.style.boxShadow='none' }}
        />
        <AnimatePresence>
          {nameErr && <motion.span initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} style={{ fontFamily:'var(--font-body)', fontSize:'0.7rem', color:'var(--color-danger)', display:'block', marginTop:4 }}>{nameErr}</motion.span>}
        </AnimatePresence>
      </div>

      <div>
        <label style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>Language</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {LANGUAGES.map(lang => (
            <motion.button key={lang} onClick={() => setLang(lang)} whileTap={{ scale: 0.95 }}
              style={{ fontFamily:'var(--font-code)', fontSize:'0.7rem', padding:'4px 10px', borderRadius:'var(--radius-full)', border:`1px solid ${language===lang?'var(--color-accent)':'var(--color-border)'}`, background:language===lang?'var(--color-accent-dim)':'transparent', color:language===lang?'var(--color-accent-light)':'var(--color-text-muted)', cursor:'pointer', transition:'all 150ms ease' }}>
              {lang}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:4 }}>
        <motion.button onClick={onClose} whileHover={{ background:'var(--color-hover)' }} whileTap={{ scale:0.97 }}
          style={{ fontFamily:'var(--font-ui)', fontSize:'0.8125rem', fontWeight:500, color:'var(--color-text-secondary)', background:'transparent', border:'1px solid var(--color-border-md)', borderRadius:'var(--radius-sm)', padding:'0.5rem 1rem', cursor:'pointer', transition:'background 150ms ease' }}>
          Cancel
        </motion.button>
        <motion.button onClick={handleCreate} disabled={loading}
          whileHover={!loading?{boxShadow:'0 0 20px var(--color-accent-glow)'}:undefined}
          whileTap={!loading?{scale:0.97}:undefined}
          style={{ fontFamily:'var(--font-ui)', fontSize:'0.8125rem', fontWeight:500, color:'#fff', background:'var(--color-accent)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.5rem 1.25rem', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', gap:6, transition:'opacity 150ms ease' }}>
          {loading ? <SpinnerIcon /> : <PlusIcon />}
          {loading ? 'Creating…' : 'Create room'}
        </motion.button>
      </div>
    </div>
  )
}

/* ── Empty state ──────────────────────────────────────────── */
function EmptyState({ onCreateRoom }: { onCreateRoom: () => void }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'4rem 2rem', textAlign:'center', gap:'1rem' }}>
      <div style={{ width:52, height:52, borderRadius:'var(--radius-lg)', background:'var(--color-elevated)', border:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.3"/><rect x="12" y="2" width="8" height="8" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.3"/><rect x="2" y="12" width="8" height="8" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.3"/><rect x="12" y="12" width="8" height="8" rx="2" stroke="var(--color-accent)" strokeWidth="1.3"/><path d="M16 14v4M14 16h4" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </div>
      <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', fontWeight:700, color:'var(--color-text-primary)', letterSpacing:'-0.01em' }}>No rooms yet</h3>
      <p style={{ fontFamily:'var(--font-body)', fontSize:'0.825rem', color:'var(--color-text-muted)', maxWidth:280, lineHeight:1.65, margin:0 }}>Create your first room and invite your team to start coding together.</p>
      <motion.button onClick={onCreateRoom} whileHover={{ scale:1.03, boxShadow:'0 0 20px var(--color-accent-glow)' }} whileTap={{ scale:0.97 }}
        style={{ fontFamily:'var(--font-ui)', fontSize:'0.8125rem', fontWeight:500, background:'var(--color-accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'0.6rem 1.25rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
        <PlusIcon /> Create your first room
      </motion.button>
    </motion.div>
  )
}

/* ── HomePage ─────────────────────────────────────────────── */
export default function HomePage() {
  const navigate   = useNavigate()

  // ── Real stores (replaces mock data) ──────────────────────
  const { user, logout }                        = useAuthStore()
  const { rooms, loadingRooms, fetchRooms, createRoom } = useRoomStore()
  const { createRoomOpen, openCreateRoom, closeCreateRoom } = useUIStore()

  const [search,     setSearch]     = useState('')
  const [view,       setView]       = useState<'grid'|'list'>('grid')
  const [filterLang, setFilterLang] = useState('all')
  const [isMobile,   setIsMobile]   = useState(false)

  // ── Fetch rooms on mount ───────────────────────────────────
  useEffect(() => {
    fetchRooms()
  }, [])

  // ── Responsive ────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // ── Filter + search ───────────────────────────────────────
  const filtered = useMemo(() => rooms.filter(r => {
    const ms = r.name.toLowerCase().includes(search.toLowerCase())
    const ml = filterLang === 'all' || r.language === filterLang
    return ms && ml
  }), [rooms, search, filterLang])

  const allLangs    = ['all', ...Array.from(new Set(rooms.map(r => r.language)))]
  const onlineTotal = rooms.reduce((s, r) => s + (r.online_count ?? 0), 0)

  // ── Create room ────────────────────────────────────────────
  const handleCreate = async (name: string, language: string) => {
    try {
      const room = await createRoom(name, language)
      closeCreateRoom()
      navigate(`/room/${room.id}`)
    } catch (err: any) {
      console.error('Create room failed:', err.message)
    }
  }

  if (loadingRooms && rooms.length === 0) {
    return <LoadingScreen message="Loading workspace…" />
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-app)', display:'flex', flexDirection:'column' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Topbar ── */}
      <header style={{ height:44, borderBottom:'1px solid var(--color-border)', background:'var(--color-surface)', display:'flex', alignItems:'center', padding:'0 clamp(1rem,4vw,1.5rem)', gap:10, flexShrink:0, position:'sticky', top:0, zIndex:20 }}>
        {/* Logo — font: Syne */}
        <motion.span initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
          style={{ fontFamily:'var(--font-heading)', fontSize:'1rem', fontWeight:800, color:'var(--color-text-primary)', letterSpacing:'-0.03em', cursor:'pointer' }}
          onClick={() => navigate('/landing')}
        >
          depot
        </motion.span>

        <div style={{ flex:1 }}/>

        {/* Online count */}
        {onlineTotal > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
            <UserCountBadge count={onlineTotal} />
          </motion.div>
        )}

        {/* New room button */}
        <Tooltip content="New room" side="bottom">
          <motion.button onClick={openCreateRoom} whileHover={{ background:'var(--color-hover)' }} whileTap={{ scale:0.93 }}
            style={{ background:'transparent', border:'1px solid var(--color-border)', borderRadius:'var(--radius-sm)', color:'var(--color-text-muted)', padding:'5px 7px', cursor:'pointer', display:'flex' }}>
            <PlusIcon />
          </motion.button>
        </Tooltip>

        {/* User avatar — real user initials */}
        <Tooltip content="Sign out" side="bottom">
          <motion.div
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ width:30, height:30, borderRadius:'50%', background:'var(--color-accent-dim)', border:'1px solid rgba(124,111,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-ui)', fontSize:'0.7rem', fontWeight:600, color:'var(--color-accent-light)', cursor:'pointer' }}
          >
            {user?.username?.slice(0,2).toUpperCase() ?? 'U'}
          </motion.div>
        </Tooltip>
      </header>

      {/* ── Main ── */}
      <main style={{ flex:1, maxWidth:900, width:'100%', margin:'0 auto', padding:'clamp(1.5rem,4vw,2.5rem) clamp(1rem,4vw,1.5rem)' }}>

        {/* Greeting — real username */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, ease:[0.16,1,0.3,1] }} style={{ marginBottom:'1.75rem' }}>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(1.4rem,5vw,2rem)', fontWeight:800, color:'var(--color-text-primary)', letterSpacing:'-0.03em', marginBottom:5 }}>
            {greeting}, {user?.username ?? 'there'}
          </h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.875rem', color:'var(--color-text-muted)', margin:0 }}>
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} · {onlineTotal > 0 ? `${onlineTotal} online` : 'no one online'}
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08, duration:0.3, ease:[0.16,1,0.3,1] }}
          style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.25rem', flexWrap:'wrap' }}>

          {/* Search */}
          <div style={{ position:'relative', flex:1, minWidth:140 }}>
            <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)', display:'flex', pointerEvents:'none' }}><SearchIcon /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…"
              style={{ width:'100%', background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-sm)', color:'var(--color-text-primary)', fontFamily:'var(--font-ui)', fontSize:'0.8125rem', padding:'0.45rem 0.75rem 0.45rem 1.9rem', outline:'none', transition:'border-color 150ms ease, box-shadow 150ms ease' }}
              onFocus={e => { e.target.style.borderColor='var(--color-accent)'; e.target.style.boxShadow='0 0 0 3px var(--color-accent-dim)' }}
              onBlur={e  => { e.target.style.borderColor='var(--color-border)';  e.target.style.boxShadow='none' }}
            />
          </div>

          {/* Lang filters */}
          {!isMobile && (
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {allLangs.slice(0,5).map(lang => (
                <motion.button key={lang} onClick={() => setFilterLang(lang)} whileTap={{ scale:0.95 }}
                  style={{ fontFamily:'var(--font-ui)', fontSize:'0.725rem', fontWeight:500, padding:'4px 10px', borderRadius:'var(--radius-full)', border:`1px solid ${filterLang===lang?'var(--color-accent)':'var(--color-border)'}`, background:filterLang===lang?'var(--color-accent-dim)':'transparent', color:filterLang===lang?'var(--color-accent-light)':'var(--color-text-muted)', cursor:'pointer', transition:'all 150ms ease', whiteSpace:'nowrap' }}>
                  {lang === 'all' ? 'All' : lang}
                </motion.button>
              ))}
            </div>
          )}

          {/* View toggle */}
          <div style={{ display:'flex', background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-sm)', padding:2, gap:2 }}>
            {(['grid','list'] as const).map(v => (
              <motion.button key={v} onClick={() => setView(v)} whileTap={{ scale:0.9 }}
                style={{ background:view===v?'var(--color-elevated)':'transparent', border:'none', borderRadius:4, color:view===v?'var(--color-text-primary)':'var(--color-text-muted)', padding:'5px 7px', cursor:'pointer', display:'flex', transition:'all 150ms ease' }}>
                {v === 'grid' ? <GridIcon /> : <ListIcon />}
              </motion.button>
            ))}
          </div>

          {/* New room CTA */}
          <motion.button onClick={openCreateRoom} whileHover={{ boxShadow:'0 0 16px var(--color-accent-glow)' }} whileTap={{ scale:0.97 }}
            style={{ fontFamily:'var(--font-ui)', fontSize:'0.8125rem', fontWeight:500, background:'var(--color-accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'0.45rem 1rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', flexShrink:0 }}>
            <PlusIcon />{isMobile ? 'New' : 'New room'}
          </motion.button>
        </motion.div>

        {/* Room list */}
        {filtered.length === 0 && search ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'3rem', fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'var(--color-text-muted)' }}>
            No rooms match <strong style={{ color:'var(--color-text-secondary)', fontFamily:'var(--font-ui)' }}>"{search}"</strong>
          </motion.div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreateRoom={openCreateRoom} />
        ) : (
          <motion.div layout style={{ display:'grid', gridTemplateColumns:view==='grid'?(isMobile?'1fr':'repeat(auto-fill, minmax(240px, 1fr))'):'1fr', gap:view==='grid'?'0.75rem':'0.45rem' }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((room, i) => (
                <RoomCard
                  key={room.id} room={room} index={i} view={view}
                  onClick={() => navigate(`/room/${room.id}`)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Create room modal */}
      <Modal
        open={createRoomOpen}
        onClose={closeCreateRoom}
        title="New room"
        description="Create a shared space to write code together"
        size="md"
      >
        <CreateRoomBody
          onClose={closeCreateRoom}
          onCreate={handleCreate}
        />
      </Modal>
    </div>
  )
}