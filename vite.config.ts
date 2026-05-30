// @lovable.dev/vite-tanstack-config already includes...
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Configuration Nitro pour Vercel
  nitro: {
    preset: "vercel",
  },
});
