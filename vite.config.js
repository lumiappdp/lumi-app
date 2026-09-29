import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuração do Vite com divisão inteligente de chunks e otimização de carregamento
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor';
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})


