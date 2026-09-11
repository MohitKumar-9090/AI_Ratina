import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'favicon.png',
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],
      manifest: {
        name: 'Retina AI — Retinal Disease Screening Platform',
        short_name: 'Retina AI',
        description: 'AI-based retinal and fundus image screening platform with 5-stage Diabetic Retinopathy classification, multi-disease screening, and Grad-CAM explainability.',
        theme_color: '#2EC4B6',
        background_color: '#e0f7fa',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/, /^\/gradcam/, /^\/reports/],
        runtimeCaching: [
          {
            // Never cache live backend API or private medical resources
            urlPattern: /^https:\/\/retina-ai-d81m\.onrender\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            // Never cache local backend API calls
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            // Never cache dynamic patient files or Grad-CAM heatmaps
            urlPattern: /\/(uploads|gradcam|reports)\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
})

