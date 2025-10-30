import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Notizz - Jegyzetek és TODO-k',
        short_name: 'Notizz',
        description: 'Jegyzet és TODO lista kezelő PWA alkalmazás',
        theme_color: '#667eea',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'hu',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        sourcemap: false
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      $lib: '/src/lib'
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'svelte-vendor': ['svelte'],
          'db-vendor': ['dexie'],
          'date-vendor': ['date-fns']
        }
      }
    }
  }
});
