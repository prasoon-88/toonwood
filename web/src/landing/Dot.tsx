import { Box } from '@mui/material'

/** Small coloured circle: window "traffic light" dots in the product mock-ups. */
export function Dot({ color, size = 11 }: { color: string; size?: number }) {
  return <Box component="span" sx={{ width: size, height: size, borderRadius: '50%', background: color, display: 'block' }} />
}
