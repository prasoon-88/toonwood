import { BrowserRouter, Route, Routes } from 'react-router'
import { LandingPage } from './landing/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { Forgot } from './pages/Forgot'
import { Login } from './pages/Login'
import { Reset } from './pages/Reset'
import { Signup } from './pages/Signup'
import { Verify } from './pages/Verify'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
