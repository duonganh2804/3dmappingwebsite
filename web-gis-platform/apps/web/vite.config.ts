import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, join, extname } from 'path'
import { copyFileSync, mkdirSync, existsSync, statSync, cpSync, createReadStream } from 'fs'
import { createRequire } from 'module'
const _require = createRequire(import.meta.url)
// rollup-plugin-external-globals: rewrite ESM bare import 'cesium' → window.Cesium
const externalGlobals = _require('rollup-plugin-external-globals')

// Plugin thủ công xử lý Cesium để tránh vấn đề double base path với vite-plugin-cesium
// vite-plugin-cesium đặt cesium vào dist/{base}/cesium/ → double prefix khi deploy GitHub Pages
// Giải pháp: tự inject script tag + copy cesium vào dist/cesium/ (flat, không có base prefix)
// Khi gh-pages push dist/ lên branch, cesium/ ở root branch → URL /3dmappingwebsite/cesium/ ✅
function cesiumPlugin(): import('vite').Plugin {
  const cesiumUnminPath = resolve(__dirname, 'node_modules/cesium/Build/CesiumUnminified')
  const cesiumProdPath = resolve(__dirname, 'node_modules/cesium/Build/Cesium')

  // MIME type map cho dev server middleware
  const mimeTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.html': 'text/html',
    '.gz': 'application/gzip',
  }

  return {
    name: 'manual-cesium-setup',
    transformIndexHtml(html) {
      // Inject với relative path - browser resolve từ base page URL
      // /3dmappingwebsite/ + cesium/Cesium.js = /3dmappingwebsite/cesium/Cesium.js ✅
      const cesiumScripts = `
  <link rel="stylesheet" href="cesium/Widgets/widgets.css">
  <script src="cesium/Cesium.js"></script>
`
      return html.replace('<head>', '<head>' + cesiumScripts)
    },
    configureServer({ middlewares }) {
      // Serve Cesium trong dev mode dưới path /3dmappingwebsite/cesium/
      middlewares.use('/3dmappingwebsite/cesium', (req: any, res: any, next: any) => {
        const url = (req.url || '/').split('?')[0]
        const filePath = join(cesiumUnminPath, url)
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const ext = extname(filePath).toLowerCase()
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
          res.setHeader('Access-Control-Allow-Origin', '*')
          createReadStream(filePath).pipe(res)
        } else {
          next()
        }
      })
    },
    async closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      const cesiumTargetPath = join(outDir, 'cesium')

      if (!existsSync(cesiumTargetPath)) {
        mkdirSync(cesiumTargetPath, { recursive: true })
      }

      const dirs = ['Assets', 'ThirdParty', 'Workers', 'Widgets']
      for (const dir of dirs) {
        const src = join(cesiumProdPath, dir)
        const dest = join(cesiumTargetPath, dir)
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true })
        }
      }

      const cesiumJs = join(cesiumProdPath, 'Cesium.js')
      if (existsSync(cesiumJs)) {
        copyFileSync(cesiumJs, join(cesiumTargetPath, 'Cesium.js'))
      }

      console.log('✅ Cesium assets copied to dist/cesium/')
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/3dmappingwebsite/',
  plugins: [
    react(),
    tailwindcss(),
    cesiumPlugin(),
  ],
  build: {
    rollupOptions: {
      // Externalize cesium khỏi bundle + rewrite bare import → window.Cesium
      // external: ['cesium'] + globals chỉ dùng được với UMD/IIFE, không phải ESM
      // Dùng rollup-plugin-external-globals để rewrite đúng cho ESM
      external: ['cesium'],
      plugins: [externalGlobals({ cesium: 'Cesium' })],
    }
  }
})
