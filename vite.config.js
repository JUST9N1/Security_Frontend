// vite.config.js
import react from "@vitejs/plugin-react";
import fs from 'fs';
import path from 'path';
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,  // Ensure source maps are fully disabled
    minify: "terser",  // Minify the output for security
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent chunk splitting
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    },
    port: 5173, 
  }
});
