import { defineConfig } from 'vite';
import { resolve } from 'path';

// Build all extension files
// Note: We use ES format but the files are self-contained
export default defineConfig({
  build: {
    outDir: 'dist-extension',
    emptyOutDir: true,
    lib: {
      entry: {
        background: resolve(__dirname, 'extension/background.ts'),
        'content-script': resolve(__dirname, 'extension/content-script.ts'),
        injected: resolve(__dirname, 'extension/injected.ts'),
        'webapp-sync': resolve(__dirname, 'extension/webapp-sync.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: {
        // Inline everything to avoid chunks
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
    target: 'esnext',
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
