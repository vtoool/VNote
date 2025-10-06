import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: project page uses '/VNote/' base
export default defineConfig({
  plugins: [react()],
  base: '/VNote/',
})
