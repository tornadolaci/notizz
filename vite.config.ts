import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// App "version" shown on the Settings screen: the build date as YY.MM.DD
const now = new Date();
const pad = (n: number): string => String(n).padStart(2, '0');
const appVersion = `${String(now.getFullYear()).slice(2)}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;

// https://vite.dev/config/
export default defineConfig({
  // The app lives at https://nomadnet.hu/app/notizz (subdirectory hosting)
  base: '/app/notizz/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
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
        start_url: '/app/notizz/',
        scope: '/app/notizz/',
        icons: [
          {
            src: 'icons/192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ],
        categories: ['productivity', 'utilities'],
        share_target: {
          // Must live inside the PWA scope
          action: '/app/notizz/share-target',
          // GET puts the shared fields in the query string, which the SPA can
          // read directly - POST would need a service worker fetch handler
          method: 'GET',
          // Explicit default - silences a Chrome DevTools manifest warning
          enctype: 'application/x-www-form-urlencoded',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        }
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // API responses must NEVER be cached - user data is always live
            urlPattern: /\/api\//,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        sourcemap: true,
        navigateFallback: null // SPA already handles routing
      },
      devOptions: {
        enabled: true, // Enable service worker in dev for testing
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      $lib: '/src/lib'
    }
  },
  server: {
    proxy: {
      // Local PHP backend: php -S localhost:8080 server/dev-router.php
      // (the front controller matches the path after "api/", so no rewrite needed)
      '/app/notizz/api': 'http://localhost:8080'
    }
  },
  preview: {
    proxy: {
      '/app/notizz/api': 'http://localhost:8080'
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'svelte-vendor': ['svelte'],
          'date-vendor': ['date-fns']
        }
      }
    }
  }
});
