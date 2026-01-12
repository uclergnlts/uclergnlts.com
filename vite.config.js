import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    server: {
        host: true
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                lab: resolve(__dirname, 'lab.html'),
                uses: resolve(__dirname, 'uses.html'),
                particleStorm: resolve(__dirname, 'demos/particle-storm.html'),
                infiniteTunnel: resolve(__dirname, 'demos/infinite-tunnel.html'),
                morphingSphere: resolve(__dirname, 'demos/morphing-sphere.html')
            }
        }
    }
})
