import { TextField } from '@mui/material'
import type { ChangeEventHandler } from 'react'

// No `required` prop on purpose: MUI would append " *" to the label.
export function Field(props: {
  label: string
  type?: string
  autoComplete?: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
}) {
  return <TextField fullWidth {...props} />
}
