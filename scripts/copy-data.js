#!/usr/bin/env node
/**
 * Copy non-TypeScript runtime assets (the card CSV) into dist/.
 * Runs as part of `npm run build` so `require("dist/index.js")` works.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src", "data", "cards.csv");
const destDir = path.join(root, "dist", "data");
const dest = path.join(destDir, "cards.csv");

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Copied ${path.relative(root, src)} → ${path.relative(root, dest)}`);
