import React, { useState } from 'react'

type Mode = 'login' | 'register'

const AuthPage = () => {
  const [mode, setMode]           = useState<Mode>('login')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [form, setForm]           = useState({ username: '', email: '', password: '' })
  const [error, setError]         = useState('')

  const isLogin = mode === 'login'

  const handleChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // TODO: wire to your API
    // const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    // const res = await fetch(endpoint, { method:'POST', body: JSON.stringify(form) })

    await new Promise(r => setTimeout(r, 1200)) // mock delay
    setLoading(false)

    // navigate('/') after success
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setForm({ username: '', email: '', password: '' })
  }

  return (
    <div style={styles.root}>

      {/* ── Background grid pattern ───────────────── */}
      <div style={styles.gridBg} />
      <div style={styles.gradientBlob1} />
      <div style={styles.gradientBlob2} />

      {/* ── Logo ─────────────────────────────────── */}
      <a href="/" style={styles.logo}>
        <span style={styles.logoDot} />
        CodeCollab
      </a>

      {/* ── Card ─────────────────────────────────── */}
      <div style={styles.card}>

        {/* Tab toggle */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin  ? styles.tabActive : styles.tabInactive) }}
            onClick={() => switchMode('login')}
          >
            Sign in
          </button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : styles.tabInactive) }}
            onClick={() => switchMode('register')}
          >
            Create account
          </button>
        </div>

        {/* Heading */}
        <div style={styles.headingBlock}>
          <h1 style={styles.heading}>
            {isLogin ? 'Welcome back' : 'Join the session'}
          </h1>
          <p style={styles.subheading}>
            {isLogin
              ? 'Sign in to your workspace and start collaborating.'
              : 'Create your account. No credit card required.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorDot} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>

          {/* Username — register only */}
          {!isLogin && (
            <label style={styles.field}>
              <span style={styles.label}>Username</span>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <UserIcon />
                </span>
                <input
                  name="username"
                  type="text"
                  placeholder="arjun_dev"
                  autoComplete="username"
                  required={!isLogin}
                  value={form.username}
                  onChange={handleChange}
                  style={styles.input}
                  onFocus={e  => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e   => Object.assign(e.target.style, inputBlurStyle)}
                />
              </div>
            </label>
          )}

          {/* Email */}
          <label style={styles.field}>
            <span style={styles.label}>Email</span>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <MailIcon />
              </span>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e  => Object.assign(e.target.style, inputBlurStyle)}
              />
            </div>
          </label>

          {/* Password */}
          <label style={styles.field}>
            <span style={styles.label}>Password</span>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <LockIcon />
              </span>
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder={isLogin ? '••••••••' : 'Min. 8 characters'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={form.password}
                onChange={handleChange}
                style={{ ...styles.input, paddingRight: '2.6rem' }}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e  => Object.assign(e.target.style, inputBlurStyle)}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>

          {/* Forgot password — login only */}
          {isLogin && (
            <div style={{ textAlign: 'right', marginTop: '-6px' }}>
              <a href="#" style={styles.forgotLink}>Forgot password?</a>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? <span style={styles.spinner} />
              : isLogin ? 'Sign in to workspace' : 'Create account'}
          </button>

        </form>

        {/* Divider */}
        <div style={styles.dividerRow}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with</span>
          <span style={styles.dividerLine} />
        </div>

        {/* OAuth placeholder buttons */}
        <div style={styles.oauthRow}>
          <button style={styles.oauthBtn}>
            <GitHubIcon />
            GitHub
          </button>
          <button style={styles.oauthBtn}>
            <GoogleIcon />
            Google
          </button>
        </div>

        {/* Switch mode link */}
        <p style={styles.switchText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            style={styles.switchLink}
            onClick={() => switchMode(isLogin ? 'register' : 'login')}
          >
            {isLogin ? 'Sign up free' : 'Sign in'}
          </button>
        </p>

      </div>

      {/* ── Footer ───────────────────────────────── */}
      <p style={styles.footer}>
        By continuing you agree to our{' '}
        <a href="#" style={styles.footerLink}>Terms</a> and{' '}
        <a href="#" style={styles.footerLink}>Privacy Policy</a>
      </p>

    </div>
  )
}

export default AuthPage

/* ─── Inline styles ──────────────────────────────────────────
   We use inline styles so the component is self-contained
   and works regardless of Tailwind purge order during dev.
   ──────────────────────────────────────────────────────────── */

const C = {
  app:          '#0d0d10',
  surface:      '#13131a',
  elevated:     '#1a1a24',
  hover:        '#22222e',
  border:       'rgba(255,255,255,0.07)',
  borderMd:     'rgba(255,255,255,0.11)',
  accent:       '#7c6ff7',
  accentLight:  '#a99ff9',
  accentDim:    'rgba(124,111,247,0.14)',
  textPrimary:  '#eeeeff',
  textSecond:   '#9d9ab8',
  textMuted:    '#66637f',
  textHint:     '#3b3950',
  danger:       '#f87171',
  dangerDim:    'rgba(248,113,113,0.12)',
  success:      '#34d399',
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: C.app,
    padding: '1.5rem 1rem',
    position: 'relative',
    overflow: 'hidden',
    gap: '1.25rem',
  },

  /* bg decorations */
  gridBg: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(124,111,247,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,111,247,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  gradientBlob1: {
    position: 'fixed',
    top: '-20%',
    left: '-10%',
    width: '50vw',
    height: '50vw',
    background: 'radial-gradient(circle, rgba(124,111,247,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  gradientBlob2: {
    position: 'fixed',
    bottom: '-20%',
    right: '-10%',
    width: '40vw',
    height: '40vw',
    background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  /* logo */
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: '1.125rem',
    color: C.textPrimary,
    textDecoration: 'none',
    letterSpacing: '-0.02em',
    zIndex: 1,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: C.accent,
    display: 'inline-block',
    boxShadow: `0 0 8px ${C.accent}`,
  },

  /* card */
  card: {
    width: '100%',
    maxWidth: 420,
    background: C.surface,
    border: `1px solid ${C.borderMd}`,
    borderRadius: 20,
    padding: 'clamp(1.5rem, 4vw, 2rem)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    position: 'relative',
    zIndex: 1,
  },

  /* tabs */
  tabs: {
    display: 'flex',
    background: C.elevated,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    border: 'none',
    borderRadius: 8,
    padding: '0.45rem 0',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  tabActive: {
    background: C.accent,
    color: '#fff',
    boxShadow: `0 2px 8px ${C.accentDim}`,
  },
  tabInactive: {
    background: 'transparent',
    color: C.textMuted,
  },

  /* heading */
  headingBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  heading: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(1.375rem, 3vw, 1.625rem)',
    color: C.textPrimary,
    letterSpacing: '-0.025em',
    lineHeight: 1.15,
    margin: 0,
  },
  subheading: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: '0.8125rem',
    color: C.textMuted,
    lineHeight: 1.6,
    margin: 0,
  },

  /* error */
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: C.dangerDim,
    border: `1px solid rgba(248,113,113,0.2)`,
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.8125rem',
    color: C.danger,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: C.danger,
    flexShrink: 0,
  },

  /* form */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    cursor: 'text',
  },
  label: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 500,
    color: C.textSecond,
    letterSpacing: '0.01em',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.75rem',
    color: C.textMuted,
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    background: C.elevated,
    border: `1px solid ${C.borderMd}`,
    borderRadius: 8,
    color: C.textPrimary,
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.875rem',
    padding: '0.55rem 0.75rem 0.55rem 2.4rem',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.6rem',
    background: 'none',
    border: 'none',
    color: C.textMuted,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
  },

  /* forgot */
  forgotLink: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.75rem',
    color: C.accentLight,
    textDecoration: 'none',
  },

  /* submit */
  submitBtn: {
    width: '100%',
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.65rem',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 150ms ease, transform 80ms ease, box-shadow 150ms ease',
    letterSpacing: '0.01em',
    marginTop: 4,
  },

  /* spinner */
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.25)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },

  /* divider */
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: C.border,
  },
  dividerText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.6875rem',
    color: C.textMuted,
    whiteSpace: 'nowrap',
  },

  /* oauth */
  oauthRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  oauthBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    background: C.elevated,
    border: `1px solid ${C.borderMd}`,
    borderRadius: 8,
    color: C.textSecond,
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.8125rem',
    fontWeight: 500,
    padding: '0.5rem',
    cursor: 'pointer',
    transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
  },

  /* switch */
  switchText: {
    textAlign: 'center',
    fontFamily: "'Manrope', sans-serif",
    fontSize: '0.8125rem',
    color: C.textMuted,
    margin: 0,
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: C.accentLight,
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
  },

  /* footer */
  footer: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.6875rem',
    color: C.textHint,
    textAlign: 'center',
    zIndex: 1,
  },
  footerLink: {
    color: C.textMuted,
    textDecoration: 'none',
  },
}

const inputFocusStyle: React.CSSProperties = {
  borderColor: '#7c6ff7',
  boxShadow: '0 0 0 3px rgba(124,111,247,0.14)',
}
const inputBlurStyle: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.11)',
  boxShadow: 'none',
}

/* ─── Tiny inline SVG icons ──────────────────────────────── */

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
)

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/>
  </svg>
)