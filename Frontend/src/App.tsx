import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LoadingScreen from './components/loadingscreen'
import { TOKEN_KEY } from './lib/constants'

/* ── Lazy pages ───────────────────────────────────────────── */
const LandingPage = React.lazy(() => import('./pages/landingpage'))
const AuthPage    = React.lazy(() => import('./pages/authpage'))
const HomePage    = React.lazy(() => import('./pages/homepage'))
const EditorPage  = React.lazy(() => import('./pages/editiorpage'))

/* ── Auth helpers ─────────────────────────────────────────── */
// Use TOKEN_KEY from constants — not hardcoded 'token'
const getToken = () => localStorage.getItem(TOKEN_KEY)

const PrivateRoute = ({ children }: { children: React.ReactNode }) =>
  getToken() ? <>{children}</> : <Navigate to="/auth" replace />

const PublicRoute = ({ children }: { children: React.ReactNode }) =>
  !getToken() ? <>{children}</> : <Navigate to="/home" replace />

/* ── Page transition ──────────────────────────────────────── */
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1,  y: 0 }}
    exit={{ opacity: 0,     y: -6 }}
    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    style={{ width: '100%', height: '100%' }}
  >
    {children}
  </motion.div>
)

/* ── Animated routes ──────────────────────────────────────── */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        <Route
          path="/landing"
          element={
            <PageTransition><LandingPage /></PageTransition>
          }
        />

        <Route
          path="/auth"
          element={
            <PublicRoute>
              <PageTransition><AuthPage /></PageTransition>
            </PublicRoute>
          }
        />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <PageTransition><HomePage /></PageTransition>
            </PrivateRoute>
          }
        />

        <Route
          path="/room/:roomId"
          element={
            <PrivateRoute>
              <PageTransition><EditorPage /></PageTransition>
            </PrivateRoute>
          }
        />

        <Route
          path="/"
          element={
            getToken()
              ? <Navigate to="/home"    replace />
              : <Navigate to="/landing" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  )
}

/* ── App ──────────────────────────────────────────────────── */
const App = () => (
  <BrowserRouter>
    <React.Suspense fallback={<LoadingScreen message="Loading…" />}>
      <AnimatedRoutes />
    </React.Suspense>
  </BrowserRouter>
)

export default App