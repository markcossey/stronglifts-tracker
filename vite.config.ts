import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // The sync API and its setup page are server pages, never the app shell.
      workbox: { navigateFallbackDenylist: [/^\/api\//] },
      includeAssets: ['icon-180.png', 'lifts/*.svg'],
      manifest: {
        name: 'StrongLifts 5×5',
        short_name: 'StrongLifts',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#030712',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
