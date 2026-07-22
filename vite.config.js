import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        expand: path.resolve(__dirname, 'popup.html'),
        newTabs: path.resolve(__dirname, 'newtab.html'),
      },
    },
  },
  server: {
    open: '/popup.html',
  },
});
