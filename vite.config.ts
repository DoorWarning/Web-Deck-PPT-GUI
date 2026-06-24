import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds the entire editor + viewer runtime into ONE self-contained index.html.
// No external .js/.css references — the output file is the distributable.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000, // inline every asset
    chunkSizeWarningLimit: 100_000,
  },
});
