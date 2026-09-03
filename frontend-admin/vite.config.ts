import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: {
    port: 3001,
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
        orders: resolve(import.meta.dirname, 'orders.html'),
        newOrder: resolve(import.meta.dirname, 'new-order.html'),
        customers: resolve(import.meta.dirname, 'customers.html'),
        measurements: resolve(import.meta.dirname, 'measurements.html'),
        profile: resolve(import.meta.dirname, 'profile.html'),
      },
    },
  },
});

