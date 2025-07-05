import path from 'path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths({
      loose: true,
      root: 'code/frontend'
    }),
    react()
  ],
  base: '',
  root: 'code/frontend',
  build: {
      outDir: '../../dist/web'
  }
})
