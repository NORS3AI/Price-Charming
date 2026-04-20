#!/usr/bin/env node
/**
 * Bundle the game engine (src/index.ts + its transitive imports) into a
 * single browser-friendly IIFE at docs/engine.js.
 *
 * The engine's loader normally does fs.readFileSync on
 * src/data/cards.csv, which doesn't work in a browser. We substitute a
 * tiny shim at bundle time that inlines the CSV as a string constant,
 * so the bundled engine carries the card data with it.
 */
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const csvPath = path.join(root, "src", "data", "cards.csv");
const loaderPath = path.join(root, "src", "cards", "loader.ts");
const outFile = path.join(root, "docs", "engine.js");

const csvContents = fs.readFileSync(csvPath, "utf8");

/**
 * esbuild plugin that rewrites the `loadCards` default-path read so the
 * browser bundle doesn't need `fs`. We intercept the loader module and
 * replace its fs call with an embedded literal.
 */
const inlineCsvPlugin = {
  name: "inline-cards-csv",
  setup(build) {
    build.onLoad({ filter: /src\/cards\/loader\.ts$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, "utf8");
      const withoutFs = source
        .replace(/import \* as fs from "fs";\n/, "")
        .replace(/import \* as path from "path";\n/, "")
        .replace(
          /export const DEFAULT_CARDS_CSV_PATH = [^;]+;/,
          'export const DEFAULT_CARDS_CSV_PATH = "embedded:cards.csv";'
        )
        .replace(
          /export function loadCards\([^)]*\): Card\[\] \{[\s\S]*?\n\}/,
          `const EMBEDDED_CARDS_CSV = ${JSON.stringify(csvContents)};
export function loadCards(_filepath?: string): Card[] {
  return parseCards(EMBEDDED_CARDS_CSV);
}`
        );
      return { contents: withoutFs, loader: "ts" };
    });
  },
};

(async () => {
  await esbuild.build({
    entryPoints: [path.join(root, "src", "index.ts")],
    bundle: true,
    format: "iife",
    globalName: "PriceCharming",
    target: ["es2019"],
    outfile: outFile,
    plugins: [inlineCsvPlugin],
    sourcemap: false,
    logLevel: "info",
  });
  const size = fs.statSync(outFile).size;
  console.log(
    `Bundled engine → ${path.relative(root, outFile)} (${(size / 1024).toFixed(1)} KB)`
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
