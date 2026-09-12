// Toutes les positions de lib/citations sont en points de code Unicode, comme
// substring() et char_length() en Postgres, et non en unités UTF-16 comme
// String.prototype.slice. Un emoji compte pour 1 ici, pour 2 dans .slice().

export function codePointLength(text: string): number {
  return Array.from(text).length;
}

/** Équivalent exact de substring(text from start + 1 for end - start) en Postgres. */
export function sliceCodePoints(text: string, start: number, end: number): string {
  return Array.from(text).slice(start, end).join("");
}
