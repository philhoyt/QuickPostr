import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

// Plugin to copy static assets from src/pwa/ to the build output.
function copyPwaAssets() {
  return {
    name: 'copy-pwa-assets',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'src/pwa');
      const outDir = path.resolve(__dirname, '../build');
      for (const file of ['manifest.json']) {
        const src = path.join(srcDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(outDir, file));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.js',
      injectRegister: null,
      manifest: false, // We provide our own manifest via src/pwa/manifest.json
      injectManifest: {
        injectionPoint: undefined,
      },
    }),
    copyPwaAssets(),
  ],

  build: {
    outDir: '../build',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        // Single bundle — no code splitting.
        entryFileNames: 'app.js',
        chunkFileNames: 'app.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'app.css';
          return assetInfo.name ?? '[name][extname]';
        },
        // Prevent any automatic chunk splitting.
        manualChunks: undefined,
      },
    },
  },
});
