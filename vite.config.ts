import { defineConfig } from 'vite';
import { resolve } from 'path';

const entry = process.env.ENTRY;

const entryConfig: Record<string, { input: string; output: string }> = {
  background: {
    input: resolve(__dirname, 'src/background/service-worker.ts'),
    output: 'background/service-worker.js',
  },
  content: {
    input: resolve(__dirname, 'src/content/content.ts'),
    output: 'content/content.js',
  },
  popup: {
    input: resolve(__dirname, 'src/popup/popup.ts'),
    output: 'popup/popup.js',
  },
};

const current = entryConfig[entry || 'background'];

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: entry === 'background',
    copyPublicDir: entry === 'background',
    rollupOptions: {
      input: current.input,
      output: {
        entryFileNames: current.output,
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
  publicDir: 'public',
});
