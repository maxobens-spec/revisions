// display_text → match_text. Chaque point de code donne exactement un point de
// code : les deux textes ont la même longueur, donc les mêmes positions
// (vérifié aussi en base : char_length(display_text) = char_length(match_text)).
//
// On neutralise uniquement : la casse, les variantes d'apostrophes, de
// guillemets et de tirets, le type d'espace, et les chiffres en indice (CO2 = CO₂).
// Restent significatifs : les accents (« a » ≠ « à ») et les exposants
// (10⁵ ≠ 105, une confusion qui changerait le sens en physique).

// " « » \u201C \u201D \u201E \u201F \u2033 ＂
const DOUBLE_QUOTES = new Set(['"', "«", "»", "\u201C", "\u201D", "\u201E", "\u201F", "\u2033", "＂"]);
// ' \u2019 \u2018 \u201A \u201B \u2032 ` ´ ʼ ＇
const SINGLE_QUOTES = new Set(["'", "\u2019", "\u2018", "\u201A", "\u201B", "\u2032", "`", "´", "ʼ", "＇"]);
// - \u2010 \u2011 \u2012 \u2013 \u2014 \u2015 \u2212 ﹣ －
const DASHES = new Set(["-", "\u2010", "\u2011", "\u2012", "\u2013", "\u2014", "\u2015", "\u2212", "﹣", "－"]);
const SUBSCRIPT_DIGITS = "₀₁₂₃₄₅₆₇₈₉";
const WHITESPACE = /^\s$/u;

export function normalizeCodePoint(cp: string): string {
  if (WHITESPACE.test(cp)) return " ";
  if (DOUBLE_QUOTES.has(cp)) return '"';
  if (SINGLE_QUOTES.has(cp)) return "'";
  if (DASHES.has(cp)) return "-";
  const subscript = SUBSCRIPT_DIGITS.indexOf(cp);
  if (subscript !== -1) return String(subscript);
  const lower = cp.toLowerCase();
  // Quelques minuscules font deux points de code (U+0130, I pointé, donne i + point
  // suscrit) : on garde l'original plutôt que de casser l'égalité des longueurs.
  return Array.from(lower).length === 1 ? lower : cp;
}

export function normalizeForMatch(displayText: string): string {
  let out = "";
  for (const cp of displayText) out += normalizeCodePoint(cp);
  return out;
}
