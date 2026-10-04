import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material'
import 'bootstrap/dist/css/bootstrap-grid.min.css'
import { App } from './App'

function Root() {
  const dark = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = useMemo(
    () => createTheme({ palette: { mode: dark ? 'dark' : 'light', primary: { main: '#4f8cff' } } }),
    [dark]
  )
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
