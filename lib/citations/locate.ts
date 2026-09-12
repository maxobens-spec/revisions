import { canonicalize } from "./canonicalize";
import { normalizeCodePoint } from "./normalize";

// Recherche d'une citation dans le texte du cours.
// La comparaison porte sur le texte normalisé (voir normalize.ts) en ignorant
// tous les espaces : « Définition : la cellule » et « Définition: la cellule »
// sont le même passage. Tout le reste doit être identique, caractère pour
// caractère. Aucune approximation, aucune distance d'édition.

export interface PreparedSource {
  readonly displayText: string;
  /** display_text en points de code : les positions sont des indices de ce tableau. */
  readonly codePoints: readonly string[];
  /** Texte normalisé, espaces retirés : c'est là qu'on cherche. */
  readonly compact: string;
  /** Pour chaque unité UTF-16 de `compact`, le point de code d'origine dans display_text. */
  readonly compactToCodePoint: readonly number[];
}

export interface Location {
  /** Début inclus, en points de code dans display_text. */
  readonly start: number;
  /** Fin exclue. */
  readonly end: number;
  /** Le passage tel qu'il est écrit dans le cours. C'est lui qu'on stocke, jamais la citation de l'IA. */
  readonly quote: string;
  /** Nombre d'apparitions dans le cours ; la première est retenue. */
  readonly occurrences: number;
}

// Ce qu'une IA ajoute ou retire volontiers aux bords d'une citation : guillemets,
// « [...] », point final, puce. Retiré aux extrémités seulement, et seulement si
// la citation telle quelle est introuvable. Au milieu, tout compte.
const EDGE_NOISE = new Set(['"', "'", ".", ",", ";", ":", "!", "?", "(", ")", "[", "]", "-", "*", "•"]);

/** À appeler une fois par version de cours, puis réutiliser pour toutes ses questions. */
export function prepareSource(displayText: string): PreparedSource {
  if (canonicalize(displayText) !== displayText) {
    throw new Error("prepareSource : le texte source doit être canonique (passer par freezeText à la relecture)");
  }
  const codePoints = Array.from(displayText);
  const compactToCodePoint: number[] = [];
  let compact = "";
  codePoints.forEach((cp, index) => {
    const normalized = normalizeCodePoint(cp);
    if (normalized === " ") return;
    compact += normalized;
    for (let unit = 0; unit < normalized.length; unit++) compactToCodePoint.push(index);
  });
  return { displayText, codePoints, compact, compactToCodePoint };
}

/** Forme comparable d'un texte : canonique, normalisée, sans aucun espace. */
export function compactNeedle(text: string): string {
  return Array.from(canonicalize(text), normalizeCodePoint)
    .filter((cp) => cp !== " ")
    .join("");
}

export function trimEdgeNoise(needle: string): string {
  let start = 0;
  let end = needle.length;
  while (start < end && EDGE_NOISE.has(needle[start]!)) start++;
  while (end > start && EDGE_NOISE.has(needle[end - 1]!)) end--;
  return needle.slice(start, end);
}

export function locate(source: PreparedSource, claimed: string): Location | null {
  const needle = compactNeedle(claimed);
  const trimmed = trimEdgeNoise(needle);
  return find(source, needle) ?? (trimmed === needle ? null : find(source, trimmed));
}

function find(source: PreparedSource, needle: string): Location | null {
  if (needle === "") return null;
  const at = source.compact.indexOf(needle);
  if (at === -1) return null;
  let occurrences = 0;
  for (let i = at; i !== -1; i = source.compact.indexOf(needle, i + 1)) occurrences++;
  const start = source.compactToCodePoint[at]!;
  const end = source.compactToCodePoint[at + needle.length - 1]! + 1;
  return { start, end, quote: source.codePoints.slice(start, end).join(""), occurrences };
}
