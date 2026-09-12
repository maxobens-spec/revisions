import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      thresholds: {
        // Le différenciateur du produit : couverture totale exigée, sinon la suite échoue.
        "lib/citations/**/*.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
      },
    },
  },
});
