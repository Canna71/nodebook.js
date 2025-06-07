import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: [{ find: "@", replacement: path.resolve("./src") }],
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
