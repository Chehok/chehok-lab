import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/chehok-lab/",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@data": resolve(__dirname, "data"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.js"],
  },
});
