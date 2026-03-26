import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/authpage'

/*
  Lazy-load heavier pages so the auth page loads instantly.
  Create these files as you build each phase.
*/
const HomePage   = React.lazy(() => import('./pages/HomePage'))
const EditorPage = React.lazy(() => import('./pages/editiorpage'))

/* ── Simple auth guard ─────────────────────────────────────── */
const getToken = () => localStorage.getItem('token')

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return getToken() ? <>{children}</> : <Navigate to="/auth" replace />
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return !getToken() ? <>{children}</> : <Navigate to="/" replace />
}

/* ── App ───────────────────────────────────────────────────── */
const App = () => {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public — redirect to home if already logged in */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          {/* Protected — redirect to /auth if not logged in */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/room/:roomId"
            element={
              <PrivateRoute>
                <EditorPage />
              </PrivateRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </React.Suspense>
    </BrowserRouter>
  )
}

export default App

/* ── Full-screen loader shown during lazy page load ─────────── */
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0d0d10',
  }}>
    <div style={{
      width: 28,
      height: 28,
      border: '2px solid rgba(124,111,247,0.2)',
      borderTop: '2px solid #7c6ff7',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  </div>
)