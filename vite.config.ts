import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// ❌ quitamos el plugin que impone dist/client
import { fileURLToPath } from "node:url";
import { telefunc } from "telefunc/vite";

export default defineConfig({
  plugins: [
    react(),
    // @ts-expect-error
    telefunc({
      disableNamingConvention: true,
    }),
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
  },
  build: {
    outDir: "dist",        // ✅ Capacitor necesita esto
    emptyOutDir: true,
  },
  base: "./",              // ✅ rutas relativas para móvil
});
