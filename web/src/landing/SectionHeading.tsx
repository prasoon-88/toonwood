import { Box, Typography } from '@mui/material'
import { tokens } from './tokens'

type Props = { id?: string; titleId?: string; title: string; subtitle?: string; align?: 'left' | 'center' }

export function SectionHeading({ id, titleId, title, subtitle, align = 'center' }: Props) {
  return (
    <Box id={id} sx={{ textAlign: align, mb: { xs: 4, md: 6 }, scrollMarginTop: '80px' }}>
      <Typography
        variant="h2"
        component="h2"
        id={titleId}
        sx={{
          background: `linear-gradient(90deg, ${tokens.ink} 55%, ${tokens.inkEnd})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          display: 'inline-block'
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: 'text.secondary', mt: 2, maxWidth: 640, mx: align === 'center' ? 'auto' : 0 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}
