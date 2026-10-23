import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `--mode mock` swaps Supabase for an in-memory stand-in so the account screens can be tested offline
const mockSupabase = {
  name: 'mock-supabase',
  enforce: 'pre',
  resolveId(source, importer) {
    if (source === './supabase' && importer?.includes('/src/lib/')) return fileURLToPath(new URL('./src/lib/supabase.mock.js', import.meta.url))
  },
}

// `npm run build:single` inlines everything into one dist-single/index.html (local-only progress, no accounts)
export default defineConfig(({ mode }) => {
  const single = mode === 'single' || mode === 'mock'
  return {
    plugins: [...(mode === 'mock' ? [mockSupabase] : []), react(), ...(single ? [viteSingleFile()] : [])],
    build: {
      chunkSizeWarningLimit: 3000,
      ...(mode === 'single' ? { outDir: 'dist-single' } : mode === 'mock' ? { outDir: 'dist-mock' } : {}),
    },
  }
})
