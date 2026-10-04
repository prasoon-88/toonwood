import { useState, type FormEvent } from 'react'
import { Link as RouterLink } from 'react-router'
import { Alert, Button, Link, Stack, Typography } from '@mui/material'
import { api } from '../api'
import { Card } from '../components/Card'
import { Field } from '../components/Field'

export function Forgot() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api('/auth/forgot', { email })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (done) {
    return (
      <Card title="Check your email">
        <Typography sx={{ mb: 2 }}>If an account exists for <b>{email}</b>, we sent a link to reset the password. It's valid for 1 hour.</Typography>
        <Link component={RouterLink} to="/login">Back to log in</Link>
      </Card>
    )
  }
  return (
    <Card title="Reset your password">
      <form onSubmit={submit} noValidate>
        <Stack spacing={2}>
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained">Send reset link</Button>
        </Stack>
      </form>
    </Card>
  )
}
