import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mustBeEscaped } from "../../scripts/invisibles.ts";

// Un caractère invisible collé tel quel dans une regex ou une chaîne passe
// inaperçu à la relecture et fausse la normalisation. Correction : npm run fix:invisibles.

const root = fileURLToPath(new URL("../../", import.meta.url));
const files = ["lib", "tests", "scripts"].flatMap((dir) =>
  readdirSync(join(root, dir), { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".ts"))
    .map((file) => join(dir, file)),
);

describe("hygiène des sources", () => {
  it.each(files)("%s ne contient aucun caractère invisible brut", (file) => {
    const offending = readFileSync(join(root, file), "utf8")
      .split("\n")
      .flatMap((line, index) =>
        [...line]
          .map((char) => char.codePointAt(0)!)
          .filter(mustBeEscaped)
          .map((n) => `ligne ${index + 1} : U+${n.toString(16).toUpperCase().padStart(4, "0")}`),
      );
    expect(offending).toEqual([]);
  });
});
