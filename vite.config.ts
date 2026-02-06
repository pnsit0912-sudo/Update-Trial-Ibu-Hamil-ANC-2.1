
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Mendefinisikan process.env agar kode client-side (VisualizationView) 
  // dapat mengakses process.env.API_KEY tanpa error "process is not defined"
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY || ''
    }
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
            if (id.includes('@google/genai')) return 'genai';
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
