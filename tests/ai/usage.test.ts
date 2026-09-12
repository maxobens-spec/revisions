import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { recordAiCall } from "../../lib/ai/usage";

const usage = (fields: Partial<Anthropic.Usage>) =>
  ({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: null, cache_read_input_tokens: null, ...fields }) as Anthropic.Usage;

describe("recordAiCall", () => {
  it("chiffre un appel Haiku 4.5 : 1 $ le million en entrée, 5 $ en sortie", () => {
    const record = recordAiCall("grading", "claude-haiku-4-5", usage({ input_tokens: 14_000, output_tokens: 5_300 }), 1200);
    expect(record).toMatchObject({ use: "grading", inputTokens: 14_000, outputTokens: 5_300, durationMs: 1200 });
    expect(record.costUsd).toBeCloseTo(0.0405, 10);
  });

  it("reconnaît un identifiant daté", () => {
    expect(recordAiCall("grading", "claude-haiku-4-5-20251001", usage({ output_tokens: 1_000_000 }), 0).costUsd).toBe(5);
  });

  it("compte l'écriture en cache à 1,25 fois et la lecture à 0,1 fois le prix d'entrée", () => {
    const record = recordAiCall(
      "generation",
      "claude-sonnet-5",
      usage({ cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 }),
      0,
    );
    expect(record.costUsd).toBeCloseTo(2 * 1.25 + 2 * 0.1, 10);
  });

  it("laisse le coût vide pour un modèle absent de la grille, plutôt que 0", () => {
    expect(recordAiCall("grading", "claude-inconnu", usage({ input_tokens: 10 }), 0).costUsd).toBeNull();
  });
});
