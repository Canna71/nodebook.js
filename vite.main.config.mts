import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [{ find: "@", replacement: path.resolve("./src") }],
    },
    build: {
    rollupOptions: {
      output: {
        sourcemap: true,
      },
    },
  },
});
