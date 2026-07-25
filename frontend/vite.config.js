import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // React 19 uses the automatic JSX runtime, so no file needs `import React`.
  // Stated explicitly here so the Vitest pipeline transforms JSX the same way the
  // production build does (otherwise test files fall back to React.createElement).
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
