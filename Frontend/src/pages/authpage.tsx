import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authstore'

/* ============================================================
   AuthPage — Login + Register
   font: Syne      → "Context" logo, page title
   font: Manrope   → subtitles, descriptions, helper text
   font: Inter     → all inputs, buttons, labels, links
   font: JetBrains → inline code hints (none here, reserved)
   ============================================================ */

/* ── Icons ─────────────────────────────────────────────────── */
const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    {open ? (
      <>
        <path d="M7.5 3C4.5 3 2 5.5 1 7.5 2 9.5 4.5 12 7.5 12s5.5-2.5 6.5-4.5C13 5.5 10.5 3 7.5 3z"
          stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
      </>
    ) : (
      <>
        <path d="M2 2l11 11M7.5 3C4.5 3 2 5.5 1 7.5c.6 1.2 1.7 2.4 3 3.2M11 5.3c1 .8 2 2 2.5 2.7C12.5 10 10.2 12 7.5 12c-.9 0-1.8-.2-2.6-.6"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </>
    )}
  </svg>
)

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1.5 12.5c0-2.5 2.5-4.5 5.5-4.5s5.5 2 5.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2.5" y="6" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="7" cy="9.5" r="1" fill="currentColor"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
    style={{ animation: 'auth-spin 0.7s linear infinite' }}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" opacity="0.8"/>
  </svg>
)

/* ── Input field ────────────────────────────────────────────── */
interface InputFieldProps {
  label:       string
  type?:       string
  value:       string
  onChange:    (v: string) => void
  placeholder: string
  icon:        React.ReactNode
  error?:      string
  autoComplete?: string
}

function InputField({
  label, type = 'text', value, onChange,
  placeholder, icon, error, autoComplete,
}: InputFieldProps) {
  const [showPass, setShowPass] = useState(false)
  const [focused,  setFocused]  = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (showPass ? 'text' : 'password') : type

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      {/* Label — font: Inter */}
      <label style={{
        fontFamily: 'var(--font-ui)',
        fontSize:   '0.75rem',
        fontWeight: 500,
        color:      error ? 'var(--color-danger)' : 'var(--color-text-secondary)',
        letterSpacing: '0.01em',
      }}>
        {label}
      </label>

      {/* Input wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Left icon */}
        <span style={{
          position:  'absolute',
          left:      12,
          top:       '50%',
          transform: 'translateY(-50%)',
          color:     focused ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
          transition:'color 150ms ease',
          display:   'flex',
          pointerEvents: 'none',
        }}>
          {icon}
        </span>

        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          style={{
            width:        '100%',
            background:   'var(--color-elevated)',
            border:       `1px solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-accent)' : 'var(--color-border-md)'}`,
            borderRadius: 'var(--radius-sm)',
            color:        'var(--color-text-primary)',
            fontFamily:   'var(--font-ui)',     /* Inter */
            fontSize:     '0.8125rem',
            padding:      '0.6rem 0.75rem 0.6rem 2.25rem',
            paddingRight: isPassword ? '2.5rem' : '0.75rem',
            outline:      'none',
            boxShadow:    focused ? '0 0 0 3px var(--color-accent-dim)' : 'none',
            transition:   'border-color 150ms ease, box-shadow 150ms ease',
          }}
        />

        {/* Show/hide password */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            style={{
              position:  'absolute',
              right:     10,
              top:       '50%',
              transform: 'translateY(-50%)',
              background:'none',
              border:    'none',
              cursor:    'pointer',
              color:     'var(--color-text-muted)',
              display:   'flex',
              padding:   4,
            }}
          >
            <EyeIcon open={showPass} />
          </button>
        )}
      </div>

      {/* Error — font: Manrope */}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              fontFamily: 'var(--font-body)',    /* Manrope */
              fontSize:   '0.6875rem',
              color:      'var(--color-danger)',
            }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Background grid decoration ─────────────────────────────── */
function GridBackground() {
  return (
    <div style={{
      position:   'fixed',
      inset:      0,
      overflow:   'hidden',
      pointerEvents: 'none',
      zIndex:     0,
    }}>
      {/* Subtle dot grid */}
      <div style={{
        position:   'absolute',
        inset:      0,
        backgroundImage: 'radial-gradient(circle, rgba(124,111,247,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}/>
      {/* Radial fade from center */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, var(--color-app) 100%)',
      }}/>
      {/* Accent glow top-left */}
      <div style={{
        position:   'absolute',
        top:        '-10%',
        left:       '-5%',
        width:      500,
        height:     500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,247,0.07) 0%, transparent 70%)',
        filter:     'blur(40px)',
      }}/>
      {/* Accent glow bottom-right */}
      <div style={{
        position:   'absolute',
        bottom:     '-10%',
        right:      '-5%',
        width:      400,
        height:     400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,247,0.05) 0%, transparent 70%)',
        filter:     'blur(40px)',
      }}/>
    </div>
  )
}

/* ── Auth card ──────────────────────────────────────────────── */
const cardVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir * 24, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit:   (dir: number) => ({ opacity: 0, x: dir * -24, scale: 0.98 }),
}

/* ── Main page ──────────────────────────────────────────────── */
export default function AuthPage() {
  const navigate    = useNavigate()
  const { login, register } = useAuthStore?.() ?? {
    login:    async () => {},
    register: async () => {},
  }

  const [view,    setView]    = useState<'login' | 'register'>('login')
  const [dir,     setDir]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Login fields
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPass,  setLoginPass]        = useState('')
  const [loginEmailErr, setLoginEmailErr] = useState('')
  const [loginPassErr,  setLoginPassErr]  = useState('')

  // Register fields
  const [regName,  setRegName]  = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass,  setRegPass]  = useState('')
  const [regPass2, setRegPass2] = useState('')
  const [regNameErr,  setRegNameErr]  = useState('')
  const [regEmailErr, setRegEmailErr] = useState('')
  const [regPassErr,  setRegPassErr]  = useState('')
  const [regPass2Err, setRegPass2Err] = useState('')

  const switchTo = (v: 'login' | 'register') => {
    setDir(v === 'register' ? 1 : -1)
    setView(v)
    setError('')
  }

  /* ── Validation ── */
  const validateLogin = () => {
    let ok = true
    setLoginEmailErr(''); setLoginPassErr('')
    if (!loginEmail)              { setLoginEmailErr('Email is required');         ok = false }
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) { setLoginEmailErr('Enter a valid email'); ok = false }
    if (!loginPass)               { setLoginPassErr('Password is required');       ok = false }
    return ok
  }

  const validateRegister = () => {
    let ok = true
    setRegNameErr(''); setRegEmailErr(''); setRegPassErr(''); setRegPass2Err('')
    if (!regName || regName.length < 2)  { setRegNameErr('Name must be at least 2 characters');  ok = false }
    if (!regEmail || !/\S+@\S+\.\S+/.test(regEmail)) { setRegEmailErr('Enter a valid email'); ok = false }
    if (!regPass  || regPass.length < 8) { setRegPassErr('Password must be at least 8 characters'); ok = false }
    if (regPass !== regPass2)            { setRegPass2Err("Passwords don't match");             ok = false }
    return ok
  }

  /* ── Submit ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLogin()) return
    setLoading(true); setError('')
    try {
      await login(loginEmail, loginPass)
      navigate('/home')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateRegister()) return
    setLoading(true); setError('')
    try {
      await register(regName, regEmail, regPass)
      navigate('/home')
    } catch {
      setError('Could not create account. Email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      width:          '100%',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'var(--color-app)',
      padding:        '2rem 1rem',
      position:       'relative',
      overflow:       'hidden',
    }}>
      <style>{`
        @keyframes auth-spin { to { transform: rotate(360deg); } }
      `}</style>

      <GridBackground />

      {/* ── Logo ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        {/* font: Syne — brand logo */}
        <span style={{
          fontFamily:  'var(--font-heading)',
          fontSize:    '1.75rem',
          fontWeight:  800,
          color:       'var(--color-text-primary)',
          letterSpacing: '-0.03em',
        }}>
          Depot
        </span>
        <div style={{
          width:     32,
          height:    2,
          background:'var(--color-accent)',
          borderRadius: 2,
          margin:    '6px auto 0',
        }}/>
      </motion.div>

      {/* ── Card ── */}
      <div style={{
        width:    '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex:   1,
        overflow: 'hidden',
      }}>
        <AnimatePresence mode="wait" custom={dir}>
          {view === 'login' ? (
            <motion.div
              key="login"
              custom={dir}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{
                background:   'var(--color-surface)',
                border:       '1px solid var(--color-border-md)',
                borderRadius: 'var(--radius-xl)',
                padding:      'clamp(1.5rem, 4vw, 2rem)',
                boxShadow:    'var(--shadow-lg)',
              }}>
                {/* Header */}
                <div style={{ marginBottom: '1.75rem' }}>
                  {/* font: Syne — page title */}
                  <h1 style={{
                    fontFamily:    'var(--font-heading)',
                    fontSize:      '1.5rem',
                    fontWeight:    800,
                    color:         'var(--color-text-primary)',
                    marginBottom:  '0.3rem',
                    letterSpacing: '-0.02em',
                  }}>
                    Welcome back
                  </h1>
                  {/* font: Manrope — subtitle */}
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   '0.8125rem',
                    color:      'var(--color-text-muted)',
                  }}>
                    Sign in to your Depot workspace
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <InputField
                    label="Email"
                    type="email"
                    value={loginEmail}
                    onChange={setLoginEmail}
                    placeholder="you@example.com"
                    icon={<MailIcon />}
                    error={loginEmailErr}
                    autoComplete="email"
                  />
                  <InputField
                    label="Password"
                    type="password"
                    value={loginPass}
                    onChange={setLoginPass}
                    placeholder="Enter your password"
                    icon={<LockIcon />}
                    error={loginPassErr}
                    autoComplete="current-password"
                  />

                  {/* Global error — font: Manrope */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1,  y: 0  }}
                        exit={{ opacity: 0 }}
                        style={{
                          background:   'var(--color-danger-dim)',
                          border:       '1px solid rgba(248,113,113,0.2)',
                          borderRadius: 'var(--radius-sm)',
                          padding:      '0.5rem 0.75rem',
                          fontFamily:   'var(--font-body)',    /* Manrope */
                          fontSize:     '0.75rem',
                          color:        'var(--color-danger)',
                        }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit — font: Inter */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.01, boxShadow: '0 0 20px var(--color-accent-glow)' } : undefined}
                    whileTap={!loading  ? { scale: 0.98 } : undefined}
                    style={{
                      width:          '100%',
                      background:     'var(--color-accent)',
                      color:          '#fff',
                      border:         'none',
                      borderRadius:   'var(--radius-sm)',
                      padding:        '0.65rem',
                      fontFamily:     'var(--font-ui)',        /* Inter */
                      fontSize:       '0.875rem',
                      fontWeight:     500,
                      cursor:         loading ? 'not-allowed' : 'pointer',
                      opacity:        loading ? 0.7 : 1,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      gap:            8,
                      marginTop:      4,
                      transition:     'opacity 150ms ease',
                    }}
                  >
                    {loading ? <SpinnerIcon /> : <ArrowRightIcon />}
                    {loading ? 'Signing in…' : 'Sign in'}
                  </motion.button>
                </form>

                {/* Divider */}
                <div style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         12,
                  margin:      '1.25rem 0',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }}/>
                  {/* font: Inter — "or" label */}
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: 'var(--color-text-hint)' }}>
                    or
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }}/>
                </div>

                {/* Switch — font: Manrope for prose, Inter for link */}
                <p style={{
                  textAlign:  'center',
                  fontFamily: 'var(--font-body)',      /* Manrope */
                  fontSize:   '0.8rem',
                  color:      'var(--color-text-muted)',
                }}>
                  Don't have an account?{' '}
                  <motion.button
                    type="button"
                    onClick={() => switchTo('register')}
                    whileHover={{ color: 'var(--color-text-primary)' }}
                    style={{
                      background:  'none',
                      border:      'none',
                      cursor:      'pointer',
                      fontFamily:  'var(--font-ui)',   /* Inter — interactive element */
                      fontSize:    '0.8rem',
                      fontWeight:  500,
                      color:       'var(--color-accent-light)',
                      padding:     0,
                    }}
                  >
                    Create one
                  </motion.button>
                </p>
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="register"
              custom={dir}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{
                background:   'var(--color-surface)',
                border:       '1px solid var(--color-border-md)',
                borderRadius: 'var(--radius-xl)',
                padding:      'clamp(1.5rem, 4vw, 2rem)',
                boxShadow:    'var(--shadow-lg)',
              }}>
                {/* Header */}
                <div style={{ marginBottom: '1.75rem' }}>
                  {/* font: Syne */}
                  <h1 style={{
                    fontFamily:    'var(--font-heading)',
                    fontSize:      '1.5rem',
                    fontWeight:    800,
                    color:         'var(--color-text-primary)',
                    marginBottom:  '0.3rem',
                    letterSpacing: '-0.02em',
                  }}>
                    Create account
                  </h1>
                  {/* font: Manrope */}
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   '0.8125rem',
                    color:      'var(--color-text-muted)',
                  }}>
                    Start collaborating in seconds
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <InputField
                    label="Display name"
                    value={regName}
                    onChange={setRegName}
                    placeholder="Your name"
                    icon={<UserIcon />}
                    error={regNameErr}
                    autoComplete="name"
                  />
                  <InputField
                    label="Email"
                    type="email"
                    value={regEmail}
                    onChange={setRegEmail}
                    placeholder="you@example.com"
                    icon={<MailIcon />}
                    error={regEmailErr}
                    autoComplete="email"
                  />
                  <InputField
                    label="Password"
                    type="password"
                    value={regPass}
                    onChange={setRegPass}
                    placeholder="At least 8 characters"
                    icon={<LockIcon />}
                    error={regPassErr}
                    autoComplete="new-password"
                  />
                  <InputField
                    label="Confirm password"
                    type="password"
                    value={regPass2}
                    onChange={setRegPass2}
                    placeholder="Repeat your password"
                    icon={<LockIcon />}
                    error={regPass2Err}
                    autoComplete="new-password"
                  />

                  {/* Global error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1,  y: 0  }}
                        exit={{ opacity: 0 }}
                        style={{
                          background:   'var(--color-danger-dim)',
                          border:       '1px solid rgba(248,113,113,0.2)',
                          borderRadius: 'var(--radius-sm)',
                          padding:      '0.5rem 0.75rem',
                          fontFamily:   'var(--font-body)',
                          fontSize:     '0.75rem',
                          color:        'var(--color-danger)',
                        }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password strength hint — font: Manrope */}
                  {regPass.length > 0 && regPass.length < 8 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        fontFamily: 'var(--font-body)',   /* Manrope */
                        fontSize:   '0.7rem',
                        color:      'var(--color-warning)',
                        marginTop:  -6,
                      }}
                    >
                      {8 - regPass.length} more character{8 - regPass.length !== 1 ? 's' : ''} needed
                    </motion.p>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.01, boxShadow: '0 0 20px var(--color-accent-glow)' } : undefined}
                    whileTap={!loading  ? { scale: 0.98 } : undefined}
                    style={{
                      width:          '100%',
                      background:     'var(--color-accent)',
                      color:          '#fff',
                      border:         'none',
                      borderRadius:   'var(--radius-sm)',
                      padding:        '0.65rem',
                      fontFamily:     'var(--font-ui)',
                      fontSize:       '0.875rem',
                      fontWeight:     500,
                      cursor:         loading ? 'not-allowed' : 'pointer',
                      opacity:        loading ? 0.7 : 1,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      gap:            8,
                      marginTop:      4,
                      transition:     'opacity 150ms ease',
                    }}
                  >
                    {loading ? <SpinnerIcon /> : <ArrowRightIcon />}
                    {loading ? 'Creating account…' : 'Get started'}
                  </motion.button>
                </form>

                {/* Divider */}
                <div style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        12,
                  margin:     '1.25rem 0',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }}/>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: 'var(--color-text-hint)' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }}/>
                </div>

                {/* Switch */}
                <p style={{
                  textAlign:  'center',
                  fontFamily: 'var(--font-body)',
                  fontSize:   '0.8rem',
                  color:      'var(--color-text-muted)',
                }}>
                  Already have an account?{' '}
                  <motion.button
                    type="button"
                    onClick={() => switchTo('login')}
                    whileHover={{ color: 'var(--color-text-primary)' }}
                    style={{
                      background: 'none',
                      border:     'none',
                      cursor:     'pointer',
                      fontFamily: 'var(--font-ui)',
                      fontSize:   '0.8rem',
                      fontWeight: 500,
                      color:      'var(--color-accent-light)',
                      padding:    0,
                    }}
                  >
                    Sign in
                  </motion.button>
                </p>

                {/* Terms — font: Manrope */}
                <p style={{
                  textAlign:  'center',
                  fontFamily: 'var(--font-body)',       /* Manrope */
                  fontSize:   '0.7rem',
                  color:      'var(--color-text-hint)',
                  marginTop:  '1rem',
                  lineHeight: 1.6,
                }}>
                  By creating an account you agree to our{' '}
                  <span style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}>Terms</span>
                  {' '}and{' '}
                  <span style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}>Privacy Policy</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer — font: Inter ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop:  '2rem',
          fontFamily: 'var(--font-ui)',          /* Inter */
          fontSize:   '0.7rem',
          color:      'var(--color-text-hint)',
          textAlign:  'center',
          position:   'relative',
          zIndex:     1,
        }}
      >
        Depot · built for developers who ship together
      </motion.p>
    </div>
  )
}