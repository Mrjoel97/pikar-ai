import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            if (id.includes('convex')) {
              return 'convex-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('@radix-ui') || id.includes('lucide')) {
              return 'ui-vendor';
            }
            if (id.includes('openai') || id.includes('@ai-sdk')) {
              return 'ai-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
