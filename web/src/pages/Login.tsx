import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { Alert, Button, Link, Stack, Typography } from '@mui/material'
import { api } from '../api'
import { Card } from '../components/Card'
import { Field } from '../components/Field'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/auth/login', { email, password })
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Log in">
      <form onSubmit={submit} noValidate>
        <Stack spacing={2}>
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={busy}>Log in</Button>
        </Stack>
      </form>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/forgot">Forgot password?</Link> · <Link component={RouterLink} to="/signup">Create an account</Link>
      </Typography>
    </Card>
  )
}
