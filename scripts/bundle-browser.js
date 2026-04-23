#!/usr/bin/env node
/**
 * Bundle the game engine (src/index.ts + its transitive imports) into a
 * single browser-friendly IIFE at docs/engine.js.
 *
 * The engine's loader normally does fs.readFileSync on
 * src/data/cards.csv, which doesn't work in a browser. We substitute a
 * tiny shim at bundle time that inlines the CSV as a string constant,
 * so the bundled engine carries the card data with it.
 *
 * After writing the bundle we also rewrite the <script src="engine.js">
 * tag in docs/index.html to include `?v=<hash>`. Without this, returning
 * players who had the page loaded once would be served the cached old
 * engine.js and see fixed bugs reappear — GitHub Pages sends no strict
 * no-cache headers, so the version query is what actually invalidates
 * the browser cache.
 */
const crypto = require("crypto");
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const csvPath = path.join(root, "src", "data", "cards.csv");
const loaderPath = path.join(root, "src", "cards", "loader.ts");
const outFile = path.join(root, "docs", "engine.js");
const htmlFile = path.join(root, "docs", "index.html");

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
  // Regenerate docs/patch-notes.json from src/patch-notes.ts so the
  // in-app changelog on the title screen always matches the latest
  // engine state. Runs before the bundle so anyone who rebuilt gets
  // both artifacts updated in lockstep.
  try {
    const genNotesPath = path.join(__dirname, "gen-patch-notes.js");
    if (fs.existsSync(genNotesPath)) {
      const { execSync } = require("child_process");
      execSync(`node ${JSON.stringify(genNotesPath)}`, { stdio: "inherit" });
    }
  } catch (err) {
    console.warn("gen-patch-notes failed (continuing):", err.message);
  }

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
  // Hash the bundle and rewrite the script tag's `?v=` query so every
  // rebuild forces a fresh fetch. Truncated to 10 hex chars — enough
  // entropy for cache invalidation.
  const bundleBuf = fs.readFileSync(outFile);
  const hash = crypto.createHash("sha256").update(bundleBuf).digest("hex").slice(0, 10);
  const html = fs.readFileSync(htmlFile, "utf8");
  const updated = html.replace(
    /<script src="engine\.js(\?v=[^"]*)?"><\/script>/,
    `<script src="engine.js?v=${hash}"></script>`
  );
  if (updated !== html) {
    fs.writeFileSync(htmlFile, updated);
    console.log(`Updated index.html script tag → engine.js?v=${hash}`);
  }
  console.log(
    `Bundled engine → ${path.relative(root, outFile)} (${(size / 1024).toFixed(1)} KB)`
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
