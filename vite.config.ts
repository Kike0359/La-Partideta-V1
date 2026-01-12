import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-v${Date.now()}-[hash].js`,
        chunkFileNames: `assets/[name]-v${Date.now()}-[hash].js`,
        assetFileNames: `assets/[name]-v${Date.now()}-[hash].[ext]`
      }
    }
  }
});
