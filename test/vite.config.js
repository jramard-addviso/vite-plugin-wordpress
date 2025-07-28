import { resolve } from 'path'
import { defineConfig } from 'vite'
import WordpressPlugin from '../src/index.js'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/dist/' : '/',
  build: {
    manifest: true,
  },
  plugins: [
    WordpressPlugin({
      wordpressConfigDir: process.cwd(),
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
    },
  },
}))
