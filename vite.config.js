import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Encaminha /api para a API backend em desenvolvimento.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
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
        },
      },
    },
  },
})
