import { canonicalize } from "./canonicalize";
import { codePointLength } from "./codepoints";
import { normalizeForMatch } from "./normalize";

/**
 * Version des règles de canonicalize, normalizeCodePoint et locate, stockée dans
 * course_versions.normalizer_version. Toute modification de ces règles doit
 * l'incrémenter : le test « règles figées » échoue tant qu'on ne l'a pas fait.
 */
export const NORMALIZER_VERSION = 1;

export interface FrozenText {
  readonly displayText: string;
  readonly matchText: string;
  readonly normalizerVersion: number;
  /** Longueur en points de code, identique pour les deux textes. */
  readonly length: number;
}

/** Texte relu par l'élève → colonnes d'une nouvelle ligne course_versions. */
export function freezeText(reviewedText: string): FrozenText {
  const displayText = canonicalize(reviewedText);
  if (displayText === "") throw new Error("freezeText : le texte relu est vide");
  return {
    displayText,
    matchText: normalizeForMatch(displayText),
    normalizerVersion: NORMALIZER_VERSION,
    length: codePointLength(displayText),
  };
}
