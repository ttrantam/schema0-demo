#!/usr/bin/env node
// Pre-compiles @orpc/* packages from ESM (.mjs) to CJS (.js) using esbuild.
// Required because Jest with --experimental-vm-modules refuses to require() .mjs files.
// Run from packages/test: node mobile/build-orpc.js
// Must be re-run when @orpc packages are upgraded.

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const scriptDir = path.dirname(__filename || __dirname);
const testRoot = path.resolve(scriptDir, "..");
const outDir = path.join(scriptDir, "compiled-orpc");
const pkgs = ["server", "client", "tanstack-query"];

// Resolve node_modules — walk up from packages/test to find the workspace root
function findNodeModules() {
  let dir = testRoot;
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, "node_modules", "@orpc");
    if (fs.existsSync(candidate)) return path.join(dir, "node_modules");
    dir = path.dirname(dir);
  }
  console.error(
    "Error: Could not find node_modules/@orpc/. " +
      "Make sure you run this from within the project and dependencies are installed.",
  );
  process.exit(1);
}

async function build() {
  const nodeModules = findNodeModules();
  fs.mkdirSync(outDir, { recursive: true });

  for (const pkg of pkgs) {
    const entry = path.join(nodeModules, "@orpc", pkg, "dist/index.mjs");
    if (!fs.existsSync(entry)) {
      console.log(`Skip: @orpc/${pkg} (not found at ${entry})`);
      continue;
    }

    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      format: "cjs",
      platform: "node",
      outfile: path.join(outDir, `${pkg}.js`),
      logLevel: "warning",
    });
    console.log(`Compiled: @orpc/${pkg}`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
