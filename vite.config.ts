import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  // Two vendor chunks are legitimately this large: the chart library (~1.7 MB) and the
  // Pine addon (~0.8 MB, fetched on demand). Every app chunk stays far below the limit,
  // so the warning is noise here rather than a signal.
  build: { chunkSizeWarningLimit: 2048 },
  server: { port: 5333, strictPort: false },
})
