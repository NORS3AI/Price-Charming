#!/usr/bin/env node
/**
 * Generate docs/patch-notes.json from src/patch-notes.ts
 *
 * This lets the in-game HTML fetch patch notes dynamically,
 * so the title screen always shows the latest version without
 * manually editing the HTML.
 *
 * Run via: npm run gen-notes
 * Or automatically via the git pre-commit hook.
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const tsFile = path.join(root, "src", "patch-notes.ts");
const jsonFile = path.join(root, "docs", "patch-notes.json");
const tempFile = path.join(__dirname, "_patch-notes-temp.js");

function generate() {
  if (!fs.existsSync(tsFile)) {
    console.error(`Source not found: ${tsFile}`);
    process.exit(1);
  }

  const source = fs.readFileSync(tsFile, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });

  fs.writeFileSync(tempFile, result.outputText);
  try {
    // Clear require cache so repeated runs see fresh content
    delete require.cache[require.resolve(tempFile)];
    const mod = require(tempFile);
    const data = mod.PATCH_NOTES;
    if (!Array.isArray(data)) {
      throw new Error("PATCH_NOTES is not an array");
    }
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2) + "\n");
    console.log(
      `Generated ${path.relative(root, jsonFile)} with ${data.length} patch notes`
    );
    console.log(`Latest: ${data[0].version} - ${data[0].title}`);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

try {
  generate();
} catch (e) {
  console.error("Failed to generate patch notes:", e.message);
  process.exit(1);
}
