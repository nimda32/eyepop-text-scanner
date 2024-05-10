import CustomHmr from "./CustomHmr.js";
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import viteReact from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const path = fileURLToPath(import.meta.url)
const root = resolve(dirname(path), 'client')

const plugins = [
    viteReact({ jsxRuntime: 'classic' }),
    nodePolyfills(),
    CustomHmr() // uncomment this this to enable a full refresh on any changes to any files
]

// copy the client/assets folder to the build folder
const config = {
    root: root,
    base: './',
    assetsInclude: [ '**/*.mp4', '**/*.webm' ],
    plugins: plugins,
    build: {
        outDir: '../dist/',
        rollupOptions: {
            plugins: [
                {
                    // copy the eyepop.min.js file to the build folder
                    name: 'copy-eyepop',
                    generateBundle(options, bundle)
                    {
                        const source = readFileSync(join(root, 'components/eyepop.min.js'))
                        writeFileSync(join(options.dir, 'eyepop.min.js'), source)
                    }
                }
            ],
            output: {
                entryFileNames: 'index.js',
                chunkFileNames: 'index.js',
                assetFileNames: 'index.[ext]'
            }
        },
    },
};

export default config;


