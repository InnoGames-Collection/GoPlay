import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const p = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        hub: p('index.html'),
        play: p('play/index.html'),
        admin: p('admin/index.html'),
        checkout: p('checkout/index.html'),
      },
    },
  },
});
