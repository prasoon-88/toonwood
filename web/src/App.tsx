import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Dashboard } from './pages/Dashboard'
import { Forgot } from './pages/Forgot'
import { Login } from './pages/Login'
import { Reset } from './pages/Reset'
import { Signup } from './pages/Signup'
import { Verify } from './pages/Verify'

// the marketing page (fonts, illustrations) is split out so the app routes do not download it
const LandingPage = lazy(() => import('./landing/LandingPage').then((m) => ({ default: m.LandingPage })))

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={null}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
