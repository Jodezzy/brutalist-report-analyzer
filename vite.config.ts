import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Specify port for Tauri to connect to
  server: {
    port: 1420,
    strictPort: true,
  },
});