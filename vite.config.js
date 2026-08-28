import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/habit-tracker/',
  // Stamped into the build so the running app can say which one it is. A whole
  // afternoon was spent testing fixes against a version that had never arrived.
  define: {
    __BUILD_ID__: JSON.stringify(
      new Date().toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Paris',
      })
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered by hand in main.jsx instead, so the app can actively ask
      // whether a new build exists rather than waiting to be told.
      injectRegister: null,
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: 'Habit Tracker',
        short_name: 'Habitudes',
        description: "Suivi quotidien d'habitudes avec jardin qui pousse",
        start_url: '/habit-tracker/',
        scope: '/habit-tracker/',
        display: 'standalone',
        background_color: '#FBF7F1',
        theme_color: '#FBF7F1',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
