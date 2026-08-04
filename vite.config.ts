import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const allowedHosts = ['.qyubit.io','.vercel.app', '.vercel.pub', 'localhost', '127.0.0.1']

export default defineConfig({ 
  plugins: [react()],
  server: { allowedHosts },
  preview: { allowedHosts },
})
