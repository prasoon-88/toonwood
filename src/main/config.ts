// Product configuration baked in at build time (see .env.example). Users never see or edit these.

/** Call Copilot backend (room-server/): rooms, transcription tokens, preset matching. */
export const API_URL = (import.meta.env.MAIN_VITE_API_URL || 'http://localhost:3030').replace(/\/$/, '')

/** Identifies this app to the backend. Not a secret per se (it ships in the binary), but stops casual API abuse. */
export const APP_KEY = import.meta.env.MAIN_VITE_APP_KEY || ''
