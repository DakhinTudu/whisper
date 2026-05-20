import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // sockjs-client expects Node's `global` (e.g. global.location) at import time
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/users': 'http://localhost:8080',
      '/conversations': 'http://localhost:8080',
      '/messages': 'http://localhost:8080',
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
