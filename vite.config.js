import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base 用于 GitHub Pages 子路径部署：https://zhaomath-blip.github.io/-/
// 本地开发（npm run dev）时 base 不影响访问
export default defineConfig({
  base: '/-/',
  plugins: [react(), tailwindcss()],
})
