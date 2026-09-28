import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: ['.monkeycode-ai.live'],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.monkeycode-ai.live'],
  },
})
