import { defineConfig } from "vite";
import { builtinModules } from "node:module";

export default defineConfig({
  build: {
    sourcemap: true,
    outDir: ".vite", // Output directory set to .vite
    lib: {
      entry: "src/main.ts",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: ["electron", ...builtinModules, "serialport", "drivelist"],
    },
  },
});
