import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change this to '/' for user/org pages, or '/<REPO_NAME>/' for project pages
const BASE = '/VNote/'

export default defineConfig({
  plugins: [react()],
  base: BASE,
})
