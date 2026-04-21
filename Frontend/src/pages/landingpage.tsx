// LandingPage.tsx — fully responsive, depot branding
// Fonts: Syne (logo/headlines) | Manrope (body/descriptions) | Inter (nav/buttons) | JetBrains (code preview)

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Badge from '../components/Badge'
import Tooltip from '../components/tooltip'

/* ── Feature data ─────────────────────────────────────────── */
const FEATURES = [
  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="16" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M16 12.5v-1M16 17.5v1M13.5 15h-1M18.5 15h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: 'Real-time CRDT sync', body: 'Every keystroke merges instantly across all collaborators. No conflicts, no last-write-wins data loss — Yjs handles it mathematically.' },
  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 9l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 17h8M10 14v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: 'VS Code quality editor', body: 'Monaco Editor gives you syntax highlighting, autocomplete, multi-cursor, and bracket matching — the full VS Code engine in the browser.' },
  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="15" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="16" cy="15" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6H4a2 2 0 00-2 2v5M13 6h3a2 2 0 012 2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: 'Live cursor presence', body: "See your teammates' cursors in real time, with color-coded names. Know exactly who is editing what, the moment it happens." },
  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 9l2.5 2.5L6 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, title: 'Shared terminal', body: 'Run your code and broadcast stdout and stderr to every participant instantly. One terminal, visible to everyone in the room.' },
  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M14.5 11v6M11.5 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, title: 'Video + voice built in', body: "WebRTC video and audio — no third-party call required. Stay in Depot, see your team's faces, ship code together." },
  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 6h12M4 10h8M4 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="16" cy="13" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M15 13h2M16 12v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, title: 'Collaborative notepad', body: "A shared rich-text scratchpad beside the editor. Drop links, sprint notes, and context — all attributed to the author." },
]

const LANGS = ['TypeScript','Python','Go','Rust','JavaScript','C++','Shell']

/* ── Code preview ─────────────────────────────────────────── */
const CODE_LINES = [
  { tokens: [{ t:'// api-refactor.ts', c:'cmt' }] },
  { tokens: [] },
  { tokens: [{ t:'import ', c:'kw' },{ t:'{ createClient } ', c:'def' },{ t:'from ', c:'kw' },{ t:"'@supabase/supabase-js'", c:'str' }] },
  { tokens: [] },
  { tokens: [{ t:'const ', c:'kw' },{ t:'supabase ', c:'def' },{ t:'= ', c:'op' },{ t:'createClient(', c:'fn' }] },
  { tokens: [{ t:'  process', c:'def' },{ t:'.env.', c:'op' },{ t:'SUPABASE_URL!,', c:'str' }] },
  { tokens: [{ t:'  process', c:'def' },{ t:'.env.', c:'op' },{ t:'SUPABASE_ANON_KEY!', c:'str' }] },
  { tokens: [{ t:')', c:'def' }] },
  { tokens: [] },
  { tokens: [{ t:'export ', c:'kw' },{ t:'async ', c:'kw' },{ t:'function ', c:'kw' },{ t:'getUser', c:'fn' },{ t:'(id: ', c:'def' },{ t:'string', c:'kw' },{ t:') {', c:'def' }] },
  { tokens: [{ t:'  const ', c:'kw' },{ t:'{ data, error } ', c:'def' },{ t:'= ', c:'op' },{ t:'await ', c:'kw' },{ t:'supabase', c:'def' }] },
  { tokens: [{ t:'    .from(', c:'fn' },{ t:"'users'", c:'str' },{ t:')', c:'def' }] },
  { tokens: [{ t:'    .select(', c:'fn' },{ t:"'*'", c:'str' },{ t:')', c:'def' }] },
  { tokens: [{ t:'    .eq(', c:'fn' },{ t:"'id', ", c:'str' },{ t:'id)', c:'def' }] },
  { tokens: [{ t:'    .single()', c:'fn' }] },
  { tokens: [] },
  { tokens: [{ t:'  if ', c:'kw' },{ t:'(error) ', c:'def' },{ t:'throw ', c:'kw' },{ t:'error', c:'def' }] },
  { tokens: [{ t:'  return ', c:'kw' },{ t:'data', c:'def' }] },
  { tokens: [{ t:'}', c:'def' }] },
]

const TC: Record<string,string> = { kw:'#7c6ff7', fn:'#60a5fa', str:'#34d399', cmt:'#4a4a60', def:'#c8c8e8', op:'#9d9ab8' }
const CURSORS = [{ name:'V', color:'#7c6ff7', line:4 },{ name:'S', color:'#34d399', line:10 },{ name:'D', color:'#fb923c', line:16 }]

function CodePreview() {
  const [activeCursor, setActiveCursor] = useState(0)
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    let i = 0; const t = setInterval(() => { i++; setVisibleLines(i); if (i >= CODE_LINES.length) clearInterval(t) }, 55)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setActiveCursor(c => (c+1) % CURSORS.length), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ background:'#0d0d14', border:'1px solid var(--color-border-md)', borderRadius:'var(--radius-lg)', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.7)', maxWidth:620, width:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', borderBottom:'1px solid var(--color-border)', background:'var(--color-surface)' }}>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#f87171' }}/>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#fbbf24' }}/>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#34d399' }}/>
        <span style={{ marginLeft:8, fontFamily:'var(--font-code)', fontSize:'0.7rem', color:'var(--color-text-muted)' }}>api-refactor.ts</span>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', gap:4 }}>
          {CURSORS.map((c,i) => (
            <motion.div key={c.name} animate={{ opacity:activeCursor===i?1:0.4, scale:activeCursor===i?1.1:1 }} transition={{ duration:0.3 }}
              style={{ width:20, height:20, borderRadius:'50%', background:c.color+'30', border:`1px solid ${c.color}80`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-ui)', fontSize:'0.6rem', fontWeight:600, color:c.color }}>
              {c.name}
            </motion.div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', maxHeight:300, overflow:'hidden' }}>
        <div style={{ padding:'12px 0', minWidth:36, textAlign:'right', paddingRight:12, background:'#0d0d14', borderRight:'1px solid var(--color-border)', userSelect:'none' }}>
          {CODE_LINES.slice(0,visibleLines).map((_,i) => (
            <div key={i} style={{ fontFamily:'var(--font-code)', fontSize:'0.7rem', color:'var(--color-text-hint)', lineHeight:'1.7' }}>{i+1}</div>
          ))}
        </div>
        <div style={{ padding:'12px 16px', flex:1, overflow:'hidden' }}>
          {CODE_LINES.slice(0,visibleLines).map((line,i) => (
            <motion.div key={i} initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.12 }}
              style={{ fontFamily:'var(--font-code)', fontSize:'0.775rem', lineHeight:'1.7', whiteSpace:'pre', position:'relative' }}>
              {CURSORS.some(c => c.line === i) && (
                <motion.div animate={{ opacity:[0.06,0.12,0.06] }} transition={{ duration:2, repeat:Infinity }}
                  style={{ position:'absolute', left:-16, right:-16, top:0, bottom:0, background:CURSORS.find(c=>c.line===i)!.color, opacity:0.08 }}/>
              )}
              {line.tokens.length > 0 ? line.tokens.map((tok,ti) => <span key={ti} style={{ color:TC[tok.c]??TC.def }}>{tok.t}</span>) : <span>&nbsp;</span>}
            </motion.div>
          ))}
          <motion.span animate={{ opacity:[1,0,1] }} transition={{ duration:1, repeat:Infinity, ease:'steps(1)' }}
            style={{ display:'inline-block', width:2, height:'0.9em', background:'var(--color-accent)', verticalAlign:'middle', borderRadius:1 }}/>
        </div>
      </div>
      <div style={{ borderTop:'1px solid var(--color-border)', padding:'8px 16px', background:'#090910', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ display:'flex', gap:5 }}>
          {['#f87171','#fbbf24','#34d399'].map(c => <span key={c} style={{ width:8, height:8, borderRadius:'50%', background:c }}/>)}
        </div>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.65rem', color:'var(--color-text-muted)', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase' }}>Terminal</span>
        <div style={{ flex:1 }}/>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.65rem', color:'var(--color-text-muted)' }}>2 watching</span>
      </div>
      <div style={{ padding:'6px 16px 10px', background:'#090910' }}>
        <span style={{ fontFamily:'var(--font-code)', fontSize:'0.725rem', color:'#34d399' }}>depot</span>
        <span style={{ fontFamily:'var(--font-code)', fontSize:'0.725rem', color:'var(--color-text-muted)' }}> · shared terminal · output broadcast to all users</span>
      </div>
    </div>
  )
}

/* ── Feature card ─────────────────────────────────────────── */
function FeatureCard({ icon, title, body, index }: { icon:React.ReactNode; title:string; body:string; index:number }) {
  return (
    <motion.div
      initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-60px' }}
      transition={{ delay:index*0.07, duration:0.4, ease:[0.16,1,0.3,1] }}
      whileHover={{ y:-3 }}
      style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem', transition:'border-color 200ms ease' }}
    >
      <div style={{ width:40, height:40, borderRadius:'var(--radius-md)', background:'var(--color-accent-dim)', border:'1px solid rgba(124,111,247,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-accent-light)', flexShrink:0 }}>
        {icon}
      </div>
      {/* font: Syne */}
      <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'0.95rem', fontWeight:700, color:'var(--color-text-primary)', letterSpacing:'-0.01em', margin:0 }}>{title}</h3>
      {/* font: Manrope */}
      <p style={{ fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'var(--color-text-muted)', lineHeight:1.7, margin:0 }}>{body}</p>
    </motion.div>
  )
}

/* ── LandingPage ──────────────────────────────────────────── */
export default function LandingPage() {
  const navigate    = useNavigate()
  const heroRef     = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const previewY    = useTransform(scrollY, [0,400], [0,40])
  const previewO    = useTransform(scrollY, [0,300], [1,0.6])
  const [langIdx, setLangIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    // Allow scroll on landing page
    document.body.style.overflow = 'auto'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setLangIdx(i => (i+1) % LANGS.length), 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-app)', overflowX:'hidden', position:'relative' }}>

      {/* Background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(124,111,247,0.07) 1px, transparent 1px)', backgroundSize:'36px 36px' }}/>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 90% 70% at 50% 0%, transparent 30%, var(--color-app) 100%)' }}/>
        <div style={{ position:'absolute', top:'-20%', left:'30%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,111,247,0.10) 0%, transparent 65%)', filter:'blur(60px)' }}/>
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
        style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', padding:'0 clamp(1rem,5vw,3rem)', height:56, borderBottom:'1px solid var(--color-border)', background:'rgba(13,13,16,0.85)', backdropFilter:'blur(12px)', gap:isMobile?12:24 }}
      >
        <img src="/logo.png" alt="Depot" style={{ height: 40, width: 'auto', cursor:'pointer' }} onClick={() => navigate('/')} />
        <div style={{ flex:1 }}/>
        {!isMobile && ['Features','Pricing','Docs'].map(link => (
          <motion.span key={link} whileHover={{ color:'var(--color-text-primary)' }}
            style={{ fontFamily:'var(--font-ui)', fontSize:'0.8125rem', color:'var(--color-text-muted)', cursor:'pointer', transition:'color 150ms ease' }}>
            {link}
          </motion.span>
        ))}
        <motion.button onClick={() => navigate('/auth')} whileHover={{ color:'var(--color-text-primary)' }}
          style={{ fontFamily:'var(--font-ui)', fontSize:'0.8125rem', fontWeight:500, background:'none', border:'none', color:'var(--color-text-secondary)', cursor:'pointer', padding:'0.4rem 0.5rem' }}>
          Sign in
        </motion.button>
        <motion.button onClick={() => navigate('/auth')} whileHover={{ boxShadow:'0 0 20px var(--color-accent-glow)', scale:1.02 }} whileTap={{ scale:0.97 }}
          style={{ fontFamily:'var(--font-ui)', fontSize:'0.8125rem', fontWeight:500, background:'var(--color-accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'0.45rem 1.1rem', cursor:'pointer' }}>
          Get started
        </motion.button>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'clamp(3rem,10vh,6rem) clamp(1rem,5vw,3rem) 0', gap:'1.25rem' }}>

        {/* Eyebrow badge */}
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
          style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--color-elevated)', border:'1px solid var(--color-border-md)', borderRadius:'var(--radius-full)', padding:'5px 14px 5px 8px' }}>
          <Badge variant="accent">New</Badge>
          {/* font: Inter */}
          <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.775rem', color:'var(--color-text-secondary)' }}>WebRTC video + shared terminal now live</span>
        </motion.div>

        {/* Headline — font: Syne */}
        <motion.h1 initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08, duration:0.55, ease:[0.16,1,0.3,1] }}
          style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(2.2rem,7vw,5rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.05, maxWidth:760, margin:0 }}>
          <span style={{ background:'linear-gradient(135deg, #eeeeff 0%, var(--color-accent-light) 60%, #60a5fa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Code together,</span>
          <br/>
          <span style={{ color:'var(--color-text-primary)' }}>ship faster.</span>
        </motion.h1>

        {/* Sub — font: Manrope */}
        <motion.p initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.5, ease:[0.16,1,0.3,1] }}
          style={{ fontFamily:'var(--font-body)', fontSize:'clamp(0.9rem,2vw,1.1rem)', color:'var(--color-text-secondary)', maxWidth:500, lineHeight:1.75, margin:0 }}>
          Depot is a collaborative code editor with real-time sync, shared terminal, live cursors, and built-in video — everything your team needs to code together, remotely.
        </motion.p>

        {/* Rotating lang badge — font: JetBrains Mono */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
          style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-ui)', fontSize:'0.8rem', color:'var(--color-text-muted)' }}>
          Works with
          <AnimatePresence mode="wait">
            <motion.span key={langIdx} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.25 }}
              style={{ fontFamily:'var(--font-code)', fontSize:'0.8rem', color:'var(--color-accent-light)', background:'var(--color-accent-dim)', border:'1px solid rgba(124,111,247,0.25)', borderRadius:'var(--radius-full)', padding:'2px 10px' }}>
              {LANGS[langIdx]}
            </motion.span>
          </AnimatePresence>
          and more
        </motion.div>

        {/* CTAs — font: Inter */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22, duration:0.45, ease:[0.16,1,0.3,1] }}
          style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
          <motion.button onClick={() => navigate('/auth')} whileHover={{ boxShadow:'0 0 32px var(--color-accent-glow)', scale:1.02 }} whileTap={{ scale:0.97 }}
            style={{ fontFamily:'var(--font-ui)', fontSize:'0.9rem', fontWeight:500, background:'var(--color-accent)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', padding:'0.75rem 1.75rem', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
            Start for free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </motion.button>
          <motion.button onClick={() => navigate('/auth')} whileHover={{ borderColor:'var(--color-border-strong)', background:'var(--color-elevated)' }} whileTap={{ scale:0.97 }}
            style={{ fontFamily:'var(--font-ui)', fontSize:'0.9rem', fontWeight:500, background:'transparent', color:'var(--color-text-secondary)', border:'1px solid var(--color-border-md)', borderRadius:'var(--radius-md)', padding:'0.75rem 1.75rem', cursor:'pointer', transition:'all 150ms ease' }}>
            See a demo
          </motion.button>
        </motion.div>

        {/* Code preview */}
        <motion.div style={{ y:previewY, opacity:previewO, marginTop:'1.25rem', width:'100%', display:'flex', justifyContent:'center', padding:'0 1rem' }}>
          <motion.div initial={{ opacity:0, y:32, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ delay:0.3, duration:0.6, ease:[0.16,1,0.3,1] }}>
            <CodePreview />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'center', gap:'clamp(2rem,8vw,5rem)', padding:'clamp(2.5rem,6vh,4rem) clamp(1rem,5vw,3rem)', flexWrap:'wrap', borderTop:'1px solid var(--color-border)', borderBottom:'1px solid var(--color-border)', margin:'3rem 0 0', background:'var(--color-surface)' }}>
        {[['< 50ms','sync latency'],['10+','supported languages'],['∞','collaborators per room'],['100%','conflict-free merging']].map(([val,lbl]) => (
          <motion.div key={lbl} initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4 }} style={{ textAlign:'center' }}>
            {/* font: Syne */}
            <div style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(1.8rem,5vw,2.8rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1, marginBottom:6, background:'linear-gradient(135deg, #eeeeff 0%, var(--color-accent-light) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{val}</div>
            {/* font: Manrope */}
            <div style={{ fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'var(--color-text-muted)' }}>{lbl}</div>
          </motion.div>
        ))}
      </section>

      {/* Features */}
      <section style={{ position:'relative', zIndex:1, maxWidth:1000, margin:'0 auto', padding:'clamp(2.5rem,6vh,4rem) clamp(1rem,5vw,2rem)' }}>
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4 }} style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          {/* font: Syne */}
          <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(1.5rem,4vw,2.25rem)', fontWeight:800, color:'var(--color-text-primary)', letterSpacing:'-0.03em', marginBottom:'0.6rem' }}>Everything your team needs</h2>
          {/* font: Manrope */}
          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.875rem', color:'var(--color-text-muted)', maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>No tab-switching, no screen sharing. One place for code, terminal, notes, and video.</p>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'0.875rem' }}>
          {FEATURES.map((f,i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </div>
      </section>

      {/* CTA banner */}
      <section style={{ position:'relative', zIndex:1, margin:'0 clamp(1rem,5vw,3rem)', padding:'clamp(2rem,5vh,3.5rem) clamp(1.5rem,5vw,4rem)', background:'var(--color-surface)', border:'1px solid var(--color-border-md)', borderRadius:'var(--radius-xl)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1.5rem', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:'-10%', top:'-50%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,111,247,0.12) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }}/>
        <motion.div initial={{ opacity:0, x:-16 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.4 }}>
          {/* font: Syne */}
          <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(1.2rem,3vw,1.75rem)', fontWeight:800, color:'var(--color-text-primary)', letterSpacing:'-0.02em', marginBottom:8 }}>Ready to ship together?</h2>
          {/* font: Manrope */}
          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.875rem', color:'var(--color-text-muted)', margin:0, maxWidth:380, lineHeight:1.65 }}>Create your first room in 30 seconds. No credit card, no setup. Just you and your team writing code.</p>
        </motion.div>
        <motion.button onClick={() => navigate('/auth')} initial={{ opacity:0, x:16 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.4, delay:0.1 }} whileHover={{ boxShadow:'0 0 32px var(--color-accent-glow)', scale:1.02 }} whileTap={{ scale:0.97 }}
          style={{ fontFamily:'var(--font-ui)', fontSize:'0.9rem', fontWeight:500, background:'var(--color-accent)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', padding:'0.8rem 2rem', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
          Get started free →
        </motion.button>
      </section>

      {/* Footer */}
      <footer style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, padding:'clamp(1.5rem,4vh,2.5rem) clamp(1rem,5vw,3rem)', borderTop:'1px solid var(--color-border)', marginTop:'3rem' }}>
        <img src="/logo.png" alt="Depot" style={{ height: 36, width: 'auto' }} />
        {/* font: Manrope */}
        <span style={{ fontFamily:'var(--font-body)', fontSize:'0.775rem', color:'var(--color-text-hint)' }}>built for developers who ship together</span>
        <div style={{ display:'flex', gap:16 }}>
          {['Privacy','Terms','GitHub'].map(link => (
            <motion.span key={link} whileHover={{ color:'var(--color-text-secondary)' }}
              style={{ fontFamily:'var(--font-ui)', fontSize:'0.775rem', color:'var(--color-text-hint)', cursor:'pointer', transition:'color 150ms ease' }}>
              {link}
            </motion.span>
          ))}
        </div>
      </footer>
    </div>
  )
}