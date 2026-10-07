import {fileURLToPath, URL} from "node:url";
import {defineConfig} from "vite";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  resolve: {
    alias: {"@src": fileURLToPath(new URL("./src", import.meta.url))},
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
