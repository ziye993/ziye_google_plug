import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function manifestPlugin() {
  return {
    name: 'manifest-generator',
    apply: () => true,
    async generateBundle() {
      const manifestPath = path.resolve(__dirname, 'manifest.js');
      const manifestUrl = pathToFileURL(manifestPath);
      const manifest = (await import(manifestUrl.href)).default;

      const outputPath = path.resolve(__dirname, 'manifest.json');
      fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
      console.log('✅ manifest.json generated in project root');
    }
  };
}

export default defineConfig({
  plugins: [react(), manifestPlugin()]
});
