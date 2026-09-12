// Usage : npm run fix:invisibles
// Reecrit en place les fichiers .ts des dossiers donnes (voir scripts/invisibles.ts).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { escapeInvisibles } from "./invisibles.ts";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("usage : node scripts/escape-invisibles.ts <dossier>...");
  process.exit(1);
}

for (const root of roots) {
  for (const file of readdirSync(root, { recursive: true, encoding: "utf8" })) {
    if (!file.endsWith(".ts")) continue;
    const path = join(root, file);
    const before = readFileSync(path, "utf8");
    const after = escapeInvisibles(before);
    if (after !== before) {
      writeFileSync(path, after);
      console.log(`echappe : ${path}`);
    }
  }
}
