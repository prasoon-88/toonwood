import { useRef, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { Alert, Button, Link, Typography } from '@mui/material'
import { api } from '../api'
import { Card } from '../components/Card'

export function Verify() {
  const [params] = useSearchParams()
  const [state, setState] = useState<'ready' | 'sending' | 'ok' | 'error'>('ready')
  const [error, setError] = useState('')
  // Links are single-use: never send the token twice. It is sent only on a click, so mail link scanners that merely open the page can't verify the account.
  const sent = useRef(false)

  function confirm() {
    if (sent.current) return
    sent.current = true
    setState('sending')
    api('/auth/verify', { token: params.get('token') ?? '' })
      .then(() => setState('ok'))
      .catch((err: Error) => {
        setError(err.message)
        setState('error')
      })
  }

  if (state === 'ready' || state === 'sending') {
    return (
      <Card title="Confirm your email">
        <Typography sx={{ mb: 2 }}>Click the button to verify your email address.</Typography>
        <Button fullWidth variant="contained" onClick={confirm} disabled={state === 'sending'}>Confirm my email</Button>
      </Card>
    )
  }
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
