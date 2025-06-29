import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore
import PreprocessorDirectives from 'unplugin-preprocessor-directives/vite'

// Runtime modules that are copied separately and should not be bundled
const externalModules = [
    // '@babel/runtime',
    // 'danfojs',
    // 'long',
    // '@tensorflow/tfjs',
    // '@tensorflow/tfjs-node',
    // 'mathjs',
    // 'seedrandom',
    // 'typed-function',

    // 'decimal.js',
    // 'complex.js',
    // 'fraction.js',
    // 'javascript-natural-sort',
    // 'lodash',
    // 'node-fetch',
    // 'escape-latex',
    // 'tiny-emitter',
    // 'papaparse',
    // 'xlsx',
    'axios',
    'd3'
];

// https://vitejs.dev/config
export default defineConfig({
    plugins: [react(), tailwindcss(),
        PreprocessorDirectives({ /* options */ })
    ],
    resolve: {
        alias: [{ find: "@", replacement: path.resolve("./src") }],
    },
    build: {
        rollupOptions: {
            external: externalModules,
            output: {
                globals: externalModules.reduce((acc, module) => {
                    acc[module] = module.replace(/[@\/]/g, '_');
                    return acc;
                }, {} as Record<string, string>),
                // Optimize chunk sizes to reduce memory usage
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
                }
            }
        },
        // Reduce memory usage during build
        // minify: 'terser',
        // terserOptions: {
        //     compress: {
        //         drop_console: false, // Keep console logs for debugging
        //         drop_debugger: true
        //     }
        // }
    },
    server: {
        watch: {
            ignored: [
                '**/examples/**',
                '**/node_modules/**',
                '**/.git/**'
            ]
        }
    }
});
