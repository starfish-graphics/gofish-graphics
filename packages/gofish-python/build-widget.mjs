import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync, mkdirSync, statSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname);
const widgetSrc = resolve(projectRoot, "widget-src", "index.ts");
const outputFile = resolve(projectRoot, "gofish", "_static", "widget.esm.js");

// Ensure output directory exists
const outputDir = dirname(outputFile);
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Check if gofish-graphics dist exists, prefer it over source
const gofishGraphicsPath = resolve(__dirname, "..", "gofish-graphics");
const gofishGraphicsDist = resolve(gofishGraphicsPath, "dist", "index.js");

let gofishGraphicsEntry = "gofish-graphics";

if (existsSync(gofishGraphicsDist)) {
  console.log(`Using gofish-graphics from dist: ${gofishGraphicsDist}`);
  // Resolve to the dist file using a plugin or alias
  // For esbuild, we can use an alias or resolve the package
  gofishGraphicsEntry = gofishGraphicsDist;
} else {
  console.log(
    `Warning: gofish-graphics dist not found at ${gofishGraphicsDist}. ` +
      `Falling back to package import. Make sure gofish-graphics is built first.`
  );
}

// Build configuration
const buildOptions = {
  entryPoints: [widgetSrc],
  bundle: true,
  platform: "browser",
  target: "es2019",
  format: "esm",
  sourcemap: "inline",
  outfile: outputFile,
  // Don't mark anything as external - bundle everything
  external: [],
  // Use resolveExtensions for ESM modules
  resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
  // Plugin to handle gofish-graphics resolution
  plugins: [
    {
      name: "gofish-graphics-resolver",
      setup(build) {
        // Resolve gofish-graphics to the dist file if it exists
        build.onResolve({ filter: /^gofish-graphics$/ }, (args) => {
          if (existsSync(gofishGraphicsDist)) {
            return {
              path: gofishGraphicsDist,
              namespace: "file",
            };
          }
          // Otherwise let esbuild resolve it normally
          return undefined;
        });
      },
    },
  ],
  logLevel: "info",
};

try {
  console.log("Building widget bundle...");
  console.log(`  Entry: ${widgetSrc}`);
  console.log(`  Output: ${outputFile}`);
  console.log(`  Bundle: true (including all dependencies)`);
  console.log(`  Format: ESM`);
  console.log(`  Platform: browser`);

  const result = await esbuild.build(buildOptions);

  if (result.errors.length > 0) {
    console.error("Build errors:", result.errors);
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn("Build warnings:", result.warnings);
  }

  const stats = statSync(outputFile);
  console.log(
    `\n✓ Build successful! Bundle size: ${(stats.size / 1024).toFixed(2)} KB`
  );
  console.log(`  Output: ${outputFile}`);
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}

