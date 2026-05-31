// @lovable.dev/vite-tanstack-config already includes...
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Configuration Nitro pour Vercel (Build Output API)
  nitro: {
    preset: "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__nitro.func",
      publicDir: ".vercel/output/static",
    },
  },
});
