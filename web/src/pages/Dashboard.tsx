import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { api, ApiError, type Account } from '../api'
import { Card } from '../components/Card'

const date = (iso: string) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })

export function Dashboard() {
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api<Account>('/account')
      .then(setAccount)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/login', { replace: true })
        else setNotice((err as Error).message)
      })
  }, [navigate])

  async function resend() {
    try {
      await api('/auth/resend-verification', {})
      setNotice('We sent you a new verification link.')
    } catch (err) {
      setNotice((err as Error).message)
    }
  }

  async function logout() {
    await api('/auth/logout', {})
    navigate('/login')
  }

  if (!account) return <Card title="Dashboard"><Typography color="text.secondary">{notice || 'Loading…'}</Typography></Card>

  return (
    <Card title="Dashboard">
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="body2" color="text.secondary">{account.user.email}</Typography>
        <Button size="small" onClick={logout}>Log out</Button>
      </Box>
      {!account.user.emailVerified && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={resend}>Resend link</Button>}
        >
          Verify your email to get your free minutes.
        </Alert>
      )}
      {notice && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{notice}</Typography>}

      <Box className="minutes" sx={{ textAlign: "center", my: 3 }}>
        <Typography className="big" component="div" variant="h2" sx={{ fontWeight: 700 }}>{account.minutesLeft}</Typography>
        <Typography variant="body2" color="text.secondary">minutes left</Typography>
      </Box>

      <Button fullWidth variant="contained" disabled title="Coming soon">Start session</Button>

      {account.packs.length > 0 && (
        <Table size="small" sx={{ mt: 3 }}>
          <TableHead>
            <TableRow><TableCell>Pack</TableCell><TableCell>Minutes left</TableCell><TableCell>Expires</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {account.packs.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.planName}</TableCell>
                <TableCell>{p.minutesLeft} / {p.minutesTotal}</TableCell>
                <TableCell>{date(p.endsAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
