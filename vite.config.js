import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Chargé en file:// dans Electron en prod : chemins relatifs.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  test: { environment: 'node' },
});
