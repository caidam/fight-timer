import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use '/' for custom domain (timer.mydomain.com)
  // Use '/repo-name/' for github.io/repo-name
  base: '/'
})
