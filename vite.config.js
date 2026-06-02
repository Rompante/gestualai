import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function removeMediapipeSourceMap() {
  return {
    name: 'remove-mediapipe-source-map',
    transform(code, id) {
      if (id.includes('@mediapipe/tasks-vision') && id.endsWith('vision_bundle.mjs')) {
        return code.replace(/\/\/\# sourceMappingURL=.*\n?$/, '')
      }
      return null
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeMediapipeSourceMap()],
  server: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    // tasks-vision ships a wasm loader that Vite should not try to pre-bundle aggressively
    exclude: ['@mediapipe/tasks-vision'],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar bibliotecas pesadas para melhor cache do browser.
          tfjs: ['@tensorflow/tfjs'],
          mediapipe: ['@mediapipe/tasks-vision'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
