import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: [
      {
        find: "@tabler/icons-react",
        replacement: "@tabler/icons-react/dist/esm/icons/index.mjs",
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: "$",
        replacement: fileURLToPath(new URL("./server/src/functions", import.meta.url)),
      },
    ],
  },
  server: {
    allowedHosts: ["dev.faun-scylla.ts.net"],
    // 🚀 Optimizaciones del servidor de desarrollo
    hmr: {
      port: 24678,
    },
    fs: {
      allow: ['..']
    }
  },
  // 🚀 Optimizaciones de Build
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // 🚀 Usar esbuild para minificación (más rápido que terser)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // 🚀 Code splitting optimizado
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mantine': ['@mantine/core', '@mantine/hooks', '@mantine/form'],
          'vendor-router': ['@tanstack/react-router'],
          'vendor-maps': ['@react-google-maps/api'],
          'vendor-icons': ['@tabler/icons-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // 🚀 Optimizar compresión
    reportCompressedSize: false,
    sourcemap: false, // Desactivar sourcemaps en producción
  },
  // 🚀 Optimizaciones adicionales
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mantine/core',
      '@mantine/hooks',
      '@tanstack/react-router'
    ],
    force: true
  },
  base: "./",              // ✅ rutas relativas para móvil
});