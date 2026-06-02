import fs from 'fs'
import { dirname } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function removeMediapipeSourceMap() {
  return {
    name: 'remove-mediapipe-source-map',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('@mediapipe/tasks-vision') && id.includes('vision_bundle.mjs')) {
        return code.replace(/\/\/\# sourceMappingURL=.*\n?$/, '')
      }
      return null
    },
    resolveId(source, importer) {
      if (source.endsWith('vision_bundle_mjs.js.map')) {
        return source
      }
      return null
    },
    load(id) {
      if (id.endsWith('vision_bundle_mjs.js.map')) {
        const realMap = id.replace(/vision_bundle_mjs\.js\.map$/, 'vision_bundle.mjs.map')
        if (fs.existsSync(realMap)) {
          return fs.readFileSync(realMap, 'utf8')
        }
      }
      return null
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeMediapipeSourceMap()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
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
