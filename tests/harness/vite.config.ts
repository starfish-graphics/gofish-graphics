import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { resolve } from "path";

export default defineConfig({
  plugins: [solidPlugin()],
  root: resolve(__dirname),
  server: {
    port: 3001,
    strictPort: false,
  },
  resolve: {
    alias: {
      "gofish-graphics": resolve(__dirname, "../../packages/gofish-graphics/src/lib.ts"),
    },
  },
});
