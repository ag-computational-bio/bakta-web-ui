import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
const viteConfig = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/s3-upload/jobs/': {
        target: 'https://bakta.s3.computational.bio.uni-giessen.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3-upload/, ''),
      },
    },
  },
})

export default viteConfig
