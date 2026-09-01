import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    manifest: {
      name: "FinTrack",
      short_name: "FinTrack",
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0b0f19",
      theme_color: "#0b0f19",
      icons: [
        {
          src: "fintrack_icon.svg",
          sizes: "192x192",
          type: "image/svg+xml"
        },
        {
          src: "fintrack_icon.svg",
          sizes: "512x512",
          type: "image/svg+xml"
        }
      ]
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/') && url.pathname.endsWith('.json') && url.origin === location.origin,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-get-cache',
            expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] }
          }
        },
        {
          urlPattern: ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.destination === 'font',
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-assets',
            expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] }
          }
        }
      ]
    }
  })],
  resolve: {
    alias: {
      'react-countup': 'react-countup/build',
    },
  },
  server: {
    port: 3000,
    host: true,
  },
})
