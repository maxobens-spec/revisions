import type Anthropic from "@anthropic-ai/sdk";
import type { AiUse } from "./models";

// Dollars par million de tokens, tarif de l'API Anthropic (grille du 2026-06-24).
// Écriture en cache : 1,25 fois le prix d'entrée (cache de 5 minutes) ; lecture : 0,1 fois.
const PRICES: readonly { readonly model: string; readonly input: number; readonly output: number }[] = [
  { model: "claude-haiku-4-5", input: 1, output: 5 },
  { model: "claude-sonnet-5", input: 2, output: 10 },
];

/** Une ligne de ai_calls : c'est ce chiffre qui décidera du prix de l'abonnement. */
export interface AiCallRecord {
  readonly use: AiUse;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheCreationInputTokens: number;
  readonly cacheReadInputTokens: number;
  /** null si le modèle n'est pas dans la grille : à compléter, plutôt que de compter 0. */
  readonly costUsd: number | null;
  readonly durationMs: number;
}

export function recordAiCall(use: AiUse, model: string, usage: Anthropic.Usage, durationMs: number): AiCallRecord {
  const cacheCreationInputTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadInputTokens = usage.cache_read_input_tokens ?? 0;
  // Un identifiant daté (claude-haiku-4-5-20251001) prend le prix de sa famille.
  const price = PRICES.find((p) => model === p.model || model.startsWith(`${p.model}-`));
  const costUsd =
    price === undefined
      ? null
      : ((usage.input_tokens + cacheCreationInputTokens * 1.25 + cacheReadInputTokens * 0.1) * price.input +
          usage.output_tokens * price.output) /
        1_000_000;
  return {
    use,
    model,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    costUsd,
    durationMs,
  };
}
