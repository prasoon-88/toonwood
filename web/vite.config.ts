/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // In dev the site runs on :5174 and talks to the backend on :3030 (set WEB_URL=http://localhost:5174 there).
  server: { port: 5174, proxy: { '/api': 'http://localhost:3030' } },
  test: { environment: 'jsdom', include: ['src/**/*.test.tsx'] }
})
