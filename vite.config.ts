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
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-label', 'class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react'],
          'convex-vendor': ['convex', '@convex-dev/auth'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'charts': ['recharts'],
          'framer': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
