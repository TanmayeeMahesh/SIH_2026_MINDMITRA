import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg'],
    manifest: {
      name: 'MindMitra', short_name: 'MindMitra', start_url: '/', display: 'standalone',
      background_color: '#FAF2EB', theme_color: '#363C2D', description: 'Offline-first dementia support companion',
      icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: {
      navigateFallback: '/index.html',
      // Audio and the T3 content-pack photos MUST be precached or the offline
      // claim is false — the default glob covers neither mp3 nor jpg. Raise
      // the size cap for the language + content packs.
      globPatterns: ['**/*.{js,css,html,svg,ico,png,jpg,jpeg,woff2,mp3}'],
      maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
    },
  })]
});
