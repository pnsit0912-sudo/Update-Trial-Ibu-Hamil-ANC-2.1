
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Gunakan strategi penggantian spesifik untuk API_KEY saja
  // agar tidak merusak process.env.NODE_ENV yang dibutuhkan library lain
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('leaflet')) return 'map';
            // Biarkan @google/genai di-handle oleh default chunking Vite
            // untuk menghindari error resolusi manual
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true
  }
});
