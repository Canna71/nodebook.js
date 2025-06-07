declare module '@tailwindcss/vite' {
  import { Plugin } from 'vite';

  export default function tailwindcssVite(): Plugin;
}

declare global {
    interface Window {
        api: ElectronApi;
    }
}