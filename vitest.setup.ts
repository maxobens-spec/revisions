// Charge .env.local dans process.env avant les tests.
// Vitest, contrairement à Next.js, ne le fait pas tout seul.
// Une variable déjà définie dans l'environnement (CI, etc.) n'est jamais écrasée.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");

if (existsSync(envPath)) {
  for (const rawLine of readFileSync(envPath, "utf-8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}
