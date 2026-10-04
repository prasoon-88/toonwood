import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const outbox = fileURLToPath(new URL('./e2e/.outbox.jsonl', import.meta.url))
const PORT = 3031

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: 'npm run build && node ../room-server/server.js',
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      DATABASE_URL: 'memory',
      MAIL_DRIVER: 'outbox',
      MAIL_OUTBOX: outbox,
      PUBLIC_URL: `http://localhost:${PORT}`,
      WEB_DIST: fileURLToPath(new URL('./dist', import.meta.url))
    }
  }
})
