import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { securityPlugin, assetSecurityPlugin } from "./vite/security.plugin";

export default defineConfig({
  plugins: [
    tailwindcss(), 
    reactRouter(), 
    tsconfigPaths(),
    securityPlugin({
      enabled: true,
      development: true,
    }),
    assetSecurityPlugin(),
  ],
  server: {
    port: process.env.NODE_ENV === 'development' && process.env.DOCKER ? 5173 : 5190,
    host: process.env.NODE_ENV === 'development' && process.env.DOCKER ? '0.0.0.0' : 'localhost',
    strictPort: false,
  },
  preview: {
    port: 5190,
  },
  resolve: {
    alias: {
      'react-router-dom': 'react-router',
    },
    dedupe: ['react-router'],
  },
});
