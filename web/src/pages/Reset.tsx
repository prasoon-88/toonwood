import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { api } from '../api'
import { Card } from '../components/Card'
import { Field } from '../components/Field'

export function Reset() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match')
    try {
      await api('/auth/reset', { token: params.get('token') ?? '', password })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (done) {
    return (
      <Card title="Password changed">
        <Typography sx={{ mb: 2 }}>You've been logged out everywhere. Log in with your new password.</Typography>
        <Button component={RouterLink} to="/login" variant="contained">Log in</Button>
      </Card>
    )
  }
  return (
    <Card title="Choose a new password">
      <form onSubmit={submit} noValidate>
        <Stack spacing={2}>
          <Field label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained">Change password</Button>
        </Stack>
      </form>
    </Card>
  )
}
