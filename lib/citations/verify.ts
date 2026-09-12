import { compactNeedle, locate, trimEdgeNoise, type PreparedSource } from "./locate";

/** Doit rester égal à la valeur par défaut de p_min dans quote_matches() (migration SQL). */
export const MIN_QUOTE_LENGTH = 25;

/** Mêmes valeurs que l'enum check_kind en base. */
export type CitationCheckKind = "quote_found" | "quote_min_length" | "answer_in_quote";

export interface CitationCheck {
  readonly kind: CitationCheckKind;
  readonly passed: boolean;
  readonly detail: string;
}

export interface VerifyOptions {
  readonly minLength?: number;
  /**
   * Texte à trous, réponse courte, vocabulaire, dates : au moins une de ces
   * réponses doit figurer dans le passage cité. Ne pas renseigner pour la
   * réponse ouverte, dont la réponse est une synthèse.
   */
  readonly answersInQuote?: readonly string[];
}

export type CitationVerdict =
  | {
      readonly ok: true;
      readonly start: number;
      readonly end: number;
      readonly quote: string;
      readonly occurrences: number;
      readonly checks: readonly CitationCheck[];
    }
  | {
      readonly ok: false;
      readonly failed: CitationCheckKind;
      readonly checks: readonly CitationCheck[];
    };

/**
 * Vérifications déterministes d'une citation revendiquée par l'IA.
 * Le juge d'ancrage (IA) vient après, dans lib/ai/, et ne tourne que sur les
 * questions qui ont passé celles-ci.
 */
export function verifyCitation(
  source: PreparedSource,
  claimedQuote: string,
  options: VerifyOptions = {},
): CitationVerdict {
  const minLength = options.minLength ?? MIN_QUOTE_LENGTH;
  const checks: CitationCheck[] = [];
  const fail = (kind: CitationCheckKind, detail: string): CitationVerdict => {
    checks.push({ kind, passed: false, detail });
    return { ok: false, failed: kind, checks };
  };

  const found = locate(source, claimedQuote);
  if (found === null) return fail("quote_found", "citation introuvable dans le cours");
  checks.push({
    kind: "quote_found",
    passed: true,
    detail: `positions ${found.start}-${found.end}, ${found.occurrences} occurrence(s)`,
  });

  const length = found.end - found.start;
  if (length < minLength) return fail("quote_min_length", `${length} caractères, minimum ${minLength}`);
  checks.push({ kind: "quote_min_length", passed: true, detail: `${length} caractères` });

  const answers = options.answersInQuote ?? [];
  if (answers.length > 0) {
    const passage = compactNeedle(found.quote);
    const present = answers.find((answer) => {
      const needle = trimEdgeNoise(compactNeedle(answer));
      return needle !== "" && passage.includes(needle);
    });
    if (present === undefined) return fail("answer_in_quote", "aucune des réponses attendues ne figure dans le passage");
    checks.push({ kind: "answer_in_quote", passed: true, detail: `« ${present} » figure dans le passage` });
  }

  return { ok: true, start: found.start, end: found.end, quote: found.quote, occurrences: found.occurrences, checks };
}
