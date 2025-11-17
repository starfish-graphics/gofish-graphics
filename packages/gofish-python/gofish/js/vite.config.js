import { defineConfig } from "vite";
import { resolve } from "path";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solidPlugin({
      // Only transform .tsx and .jsx files, not already-compiled code
      solid: {
        generate: "dom",
      },
      // Don't transform node_modules or already-built packages
      include: ["**/*.tsx", "**/*.jsx"],
      exclude: ["**/node_modules/**", "**/gofish-graphics/**"],
    }),
  ],
  build: {
    target: "esnext",
    lib: {
      entry: resolve(__dirname, "client-render.js"),
      name: "GoFishClient",
      fileName: "gofish-client",
      formats: ["iife"], // Immediately Invoked Function Expression for browser
    },
    rollupOptions: {
      external: [], // Bundle everything - no dynamic loading
      output: {
        // Inline all dependencies
        inlineDynamicImports: true,
        // Ensure proper IIFE format
        format: "iife",
        name: "GoFishClient",
      },
    },
    // Ensure all dependencies are bundled
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  // Don't use alias - let it resolve naturally from package.json
  // The gofish-graphics package.json already points to dist/index.js
});
