import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages project site -> https://<user>.github.io/Gym-Tracker/
  base: '/Gym-Tracker/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'متابع الجيم — Gym Tracker',
        short_name: 'جيم تراكر',
        description:
          'تطبيق متابعة التمرين والاشتراك والوزن. كل البيانات محفوظة على جهازك فقط، ويعمل بدون إنترنت.',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/Gym-Tracker/',
        scope: '/Gym-Tracker/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        categories: ['health', 'fitness', 'productivity'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    css: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/main.jsx', 'src/**/*.test.{js,jsx}', 'src/data/**'],
    },
  },
})
