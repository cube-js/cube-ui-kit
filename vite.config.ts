// vite.config.ts
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Read and parse the package.json file
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8'),
);
const version = packageJson.version;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  define: {
    'process.env.VERSION': JSON.stringify(version),
  },
});
