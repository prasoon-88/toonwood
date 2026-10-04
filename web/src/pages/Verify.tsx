import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { Alert, Button, Link, Typography } from '@mui/material'
import { api } from '../api'
import { Card } from '../components/Card'

export function Verify() {
  const [params] = useSearchParams()
  const [state, setState] = useState<'working' | 'ok' | 'error'>('working')
  const [error, setError] = useState('')
  // Links are single-use: make sure a double render never sends the token twice.
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    api('/auth/verify', { token: params.get('token') ?? '' })
      .then(() => setState('ok'))
      .catch((err: Error) => {
        setError(err.message)
        setState('error')
      })
  }, [params])

  if (state === 'working') return <Card title="Verifying…"><Typography color="text.secondary">One moment.</Typography></Card>
  if (state === 'error') {
    return (
      <Card title="Link not valid">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Typography><Link component={RouterLink} to="/login">Log in</Link> to get a new link.</Typography>
      </Card>
    )
  }
  return (
    <Card title="Email verified">
      <Typography sx={{ mb: 2 }}>Your free minutes are ready. Log in to continue.</Typography>
      <Button component={RouterLink} to="/login" variant="contained">Log in</Button>
    </Card>
  )
}
