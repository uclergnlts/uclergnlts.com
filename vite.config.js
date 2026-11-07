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
                notFound: resolve(__dirname, '404.html'),
                audioReactive: resolve(__dirname, 'demos/audio-reactive.html'),
                particleStorm: resolve(__dirname, 'demos/particle-storm.html'),
                infiniteTunnel: resolve(__dirname, 'demos/infinite-tunnel.html'),
                kineticType: resolve(__dirname, 'demos/kinetic-type.html'),
                morphingSphere: resolve(__dirname, 'demos/morphing-sphere.html'),
                neonFluid: resolve(__dirname, 'demos/neon-fluid.html'),
                springLab: resolve(__dirname, 'demos/spring-lab.html')
            }
        }
    }
})
