import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@widgets': fileURLToPath(new URL('../scene-editor/src/widgets', import.meta.url))
        }
    },
    server: {
        port: 5177,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            },
            '/uploads': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    }
})
