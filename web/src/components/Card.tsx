import type { ReactNode } from 'react'
import { Card as MuiCard, CardContent, Typography } from '@mui/material'

/** A centred page card laid out with the Bootstrap grid. */
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5">
          <MuiCard variant="outlined" component="main">
            <CardContent sx={{ p: 3 }}>
              <Typography color="primary" sx={{ mb: 1, fontWeight: 700 }}>Toonwide</Typography>
              <Typography variant="h5" component="h1" sx={{ mb: 2 }}>{title}</Typography>
              {children}
            </CardContent>
          </MuiCard>
        </div>
      </div>
    </div>
  )
}
