// Load .env before any other module reads process.env (imported first by server.js).
// On hosting platforms the variables come from the dashboard instead and there is no .env file.
try {
  process.loadEnvFile(new URL('./.env', import.meta.url))
} catch (err) {
  if (err.code !== 'ENOENT') throw err
}
