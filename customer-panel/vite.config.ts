import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: {
    port: 3002,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        signin: resolve(import.meta.dirname, 'signin.html'),
        signup: resolve(import.meta.dirname, 'signup.html'),
        profile: resolve(import.meta.dirname, 'profile.html'),
      },
    },
  },
});

