import { useState, type FormEvent } from 'react'
import { Link as RouterLink } from 'react-router'
import { Alert, Button, Link, Stack, Typography } from '@mui/material'
import { api } from '../api'
import { Card } from '../components/Card'
import { Field } from '../components/Field'

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match')
    if (password.length < 10) return setError('Password must be at least 10 characters')
    setBusy(true)
    try {
      await api('/auth/signup', { email, password })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Card title="Check your email">
        <Typography sx={{ mb: 2 }}>We sent a link to <b>{email}</b>. Open it to activate your account and get your free minutes.</Typography>
        <Link component={RouterLink} to="/login">Go to log in</Link>
      </Card>
    )
  }

  return (
    <Card title="Create your account">
      <form onSubmit={submit} noValidate>
        <Stack spacing={2}>
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={busy}>Create account</Button>
        </Stack>
      </form>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
      </Typography>
    </Card>
  )
}
