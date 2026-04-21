import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Short build tag surfaced in the UI so we can visually confirm which
// bundle a phone is actually running.
const BUILD_TAG = new Date().toISOString().slice(0, 16).replace('T', ' ')

export default defineConfig({
  define: {
    __BUILD_TAG__: JSON.stringify(BUILD_TAG)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Force the new service worker to activate immediately on deploy
        // instead of waiting for all tabs to close. Combined with
        // clientsClaim, users get the new bundle on the next refresh.
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'Trappin Japan',
        short_name: 'Trappin Japan',
        description: 'Async rap battle app',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
