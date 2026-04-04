import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LoadingScreen from './components/loadingscreen'

/* ── Lazy pages ───────────────────────────────────────────── */
const LandingPage = React.lazy(() => import('./pages/LandingPage'))
const AuthPage    = React.lazy(() => import('./pages/authpage'))
const HomePage    = React.lazy(() => import('./pages/homepage'))
const EditorPage  = React.lazy(() => import('./pages/editiorpage'))

/* ── Auth helpers ─────────────────────────────────────────── */
const getToken = () => localStorage.getItem('token')

const PrivateRoute = ({ children }: { children: React.ReactNode }) =>
  getToken() ? <>{children}</> : <Navigate to="/auth" replace />

const PublicRoute = ({ children }: { children: React.ReactNode }) =>
  !getToken() ? <>{children}</> : <Navigate to="/home" replace />

/* ── Page transition wrapper ──────────────────────────────── */
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

/* ── Animated routes (needs location for AnimatePresence) ─── */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Landing — public marketing page */}
        <Route
          path="/landing"
          element={
            <PageTransition>
              <LandingPage />
            </PageTransition>
          }
        />

        {/* Auth — redirect to /home if already logged in */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <PageTransition>
                <AuthPage />
              </PageTransition>
            </PublicRoute>
          }
        />

        {/* Home — room list */}
        <Route
          path="/home"
          element={
            // Uncomment when auth is wired:
            // <PrivateRoute>
              <PageTransition>
                <HomePage />
              </PageTransition>
            // </PrivateRoute>
          }
        />

        {/* Editor room */}
        <Route
          path="/room/:roomId"
          element={
            // <PrivateRoute>
              <PageTransition>
                <EditorPage />
              </PageTransition>
            // </PrivateRoute>
          }
        />

        {/* Root → landing if not logged in, home if logged in */}
        <Route
          path="/"
          element={
            getToken()
              ? <Navigate to="/home" replace />
              : <Navigate to="/landing" replace />
          }
        />

        {/* Catch-all */}
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