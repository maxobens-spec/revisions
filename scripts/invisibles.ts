// Caracteres invisibles, ou sosies d'un caractere ASCII, qui doivent s'ecrire
// en \uXXXX dans les sources et dans les cours de test : a la relecture, une
// insecable ressemble a une espace et une apostrophe courbe a une droite.
// Ce fichier reste en ASCII pur pour la meme raison.

const BACKSLASH = String.fromCharCode(92);

export function mustBeEscaped(codePoint: number): boolean {
  const n = codePoint;
  return (
    (n < 0x20 && n !== 0x09 && n !== 0x0a && n !== 0x0d) || // controles C0
    (n >= 0x7f && n <= 0xa0) || // DEL, controles C1, insecable
    n === 0xad || // cesure conditionnelle
    (n >= 0x0300 && n <= 0x036f) || // accents combinants (e + accent ressemble a e accent)
    n === 0x034f ||
    n === 0x061c ||
    n === 0x1680 ||
    n === 0x180e ||
    (n >= 0x2000 && n <= 0x200f) || // espaces typographiques, largeur nulle
    (n >= 0x2010 && n <= 0x2015) || // tirets
    (n >= 0x2018 && n <= 0x201f) || // apostrophes et guillemets courbes
    n === 0x2026 || // points de suspension
    (n >= 0x2028 && n <= 0x202f) || // separateurs de ligne, insecable fine
    (n >= 0x2032 && n <= 0x2033) || // primes
    (n >= 0x205f && n <= 0x206f) ||
    n === 0x2212 || // signe moins
    n === 0x3000 ||
    (n >= 0xfb00 && n <= 0xfb06) || // ligatures
    n === 0xfeff ||
    (n >= 0xfff9 && n <= 0xfffd)
  );
}

/**
 * Remplace chaque caractere a echapper par \uXXXX, et chaque marqueur ASCII
 * {{U+XXXX}} par l'echappement correspondant (utile pour ecrire un demi
 * caractere de substitution, impossible a stocker tel quel en UTF-8).
 */
export function escapeInvisibles(source: string): string {
  let out = "";
  for (const char of source.replace(/^\uFEFF/, "")) {
    const n = char.codePointAt(0)!;
    out += mustBeEscaped(n) ? BACKSLASH + "u" + n.toString(16).toUpperCase().padStart(4, "0") : char;
  }
  return out.replace(/\{\{U\+([0-9A-F]{4})\}\}/g, (_marker, hex: string) => BACKSLASH + "u" + hex);
}
