// Un modèle par usage : changer de modèle = changer une ligne ici.
// Décision produit : Haiku 4.5 partout, Sonnet seulement si la qualité mesurée
// est insuffisante. Le coût réel de chaque appel part dans ai_calls (voir usage.ts).
export const MODELS = {
  extraction: "claude-haiku-4-5",
  generation: "claude-haiku-4-5",
  groundingJudge: "claude-haiku-4-5",
  grading: "claude-haiku-4-5",
} as const satisfies Record<string, string>;

export type AiUse = keyof typeof MODELS;
