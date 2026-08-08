import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/3dmappingwebsite/',
  plugins: [
    react(),
    tailwindcss(),
    typeof cesium === 'function' ? (cesium as any)() : (cesium as any).default()
  ],
})
