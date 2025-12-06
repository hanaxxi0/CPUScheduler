
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: ضع اسم الريبو كما يظهر في رابط GitHub Pages
  base: '/CPUScheduler/',
})

