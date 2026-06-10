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
                audioSpectrum: resolve(__dirname, 'demos/audio-spectrum.html'),
                auroraBorealis: resolve(__dirname, 'demos/aurora-borealis.html'),
                digitalRain: resolve(__dirname, 'demos/digital-rain.html'),
                easingVisualizer: resolve(__dirname, 'demos/easing-visualizer.html'),
                gravityField: resolve(__dirname, 'demos/gravity-field.html'),
                holographicUi: resolve(__dirname, 'demos/holographic-ui.html'),
                particleStorm: resolve(__dirname, 'demos/particle-storm.html'),
                infiniteTunnel: resolve(__dirname, 'demos/infinite-tunnel.html'),
                kineticType: resolve(__dirname, 'demos/kinetic-type.html'),
                morphingSphere: resolve(__dirname, 'demos/morphing-sphere.html'),
                neonFluid: resolve(__dirname, 'demos/neon-fluid.html'),
                neuralInterface: resolve(__dirname, 'demos/neural-interface.html'),
                parallaxStars: resolve(__dirname, 'demos/parallax-stars.html'),
                shaderPlayground: resolve(__dirname, 'demos/shader-playground.html')
            }
        }
    }
})
