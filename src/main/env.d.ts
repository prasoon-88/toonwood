/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly MAIN_VITE_API_URL?: string
  readonly MAIN_VITE_APP_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
