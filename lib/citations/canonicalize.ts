// Texte brut (OCR, PDF, texte collé) → texte canonique : celui que l'élève relit
// et qui devient display_text. Les règles sont volontairement conservatrices :
// on ne retire que ce qui est du bruit sans ambiguïté.
//
// Les césures de fin de ligne (« photo-\nsynthèse ») ne sont PAS recollées :
// « arc-\nen-ciel » rend la règle ambiguë. C'est la relecture qui les corrige.
//
// Toute modification ici change les positions : incrémenter NORMALIZER_VERSION.
// Les caractères invisibles s'écrivent en \uXXXX (vérifié par tests/citations/source-hygiene).

const LINE_BREAKS = /\r\n|[\r\u000B\u000C\u0085\u2028\u2029]/g;

// Contrôles C0 et C1 (sauf \t et \n), césure conditionnelle, espaces de largeur nulle, BOM.
const INVISIBLES = /[\u0000-\u0008\u000E-\u001F\u007F-\u009F\u00AD\u200B-\u200D\u2060\uFEFF]/g;

// Ligatures produites par l'extraction des PDF. « œ » et « æ » sont de vraies lettres : on n'y touche pas.
const LIGATURES: Record<string, string> = {
  "\uFB00": "ff",
  "\uFB01": "fi",
  "\uFB02": "fl",
  "\uFB03": "ffi",
  "\uFB04": "ffl",
  "\uFB05": "st",
  "\uFB06": "st",
};

// Tabulation, espace, insécables (dont l'insécable fine avant « ; : ! ? »), espaces typographiques.
const HORIZONTAL_SPACES = /[\t \u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g;

export function canonicalize(raw: string): string {
  return raw
    .toWellFormed()
    .replace(LINE_BREAKS, "\n")
    .replace(INVISIBLES, "")
    .replace(/[\uFB00-\uFB06]/g, (ligature) => LIGATURES[ligature]!)
    .replace(/\u2026/g, "...")
    .normalize("NFC")
    .replace(HORIZONTAL_SPACES, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
