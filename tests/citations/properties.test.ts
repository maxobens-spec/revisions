import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  canonicalize,
  codePointLength,
  compactNeedle,
  freezeText,
  locate,
  normalizeForMatch,
  prepareSource,
  sliceCodePoints,
} from "../../lib/citations";
import { COURSES } from "./fixtures/courses";

// Caractères connus pour piéger une normalisation, mêlés à de l'Unicode quelconque.
const TRICKY = [
  "\r\n", "\r", "\n", "\t", " ", "\u00A0", "\u202F", "\u00AD", "\u200B", "\uFEFF", "\u2026", "\uFB01",
  "e\u0301", "\u0301", "\u2019", "«", "»", "\u2014", "\u2212", "İ", "ß", "\u{1F4CC}",
  "₂", "²", "\u2028", "\uD800", "a", "É", ".", "-",
];
const messyText = fc
  .array(fc.oneof(fc.constantFrom(...TRICKY), fc.string({ unit: "binary", maxLength: 4 })), { maxLength: 40 })
  .map((parts) => parts.join(""));

const sources = COURSES.map((course) => prepareSource(freezeText(course.raw).displayText));

// Un vrai passage d'un des cours, pris au hasard.
const realPassage = fc
  .record({
    course: fc.nat({ max: sources.length - 1 }),
    from: fc.nat(),
    length: fc.integer({ min: 25, max: 120 }),
  })
  .map(({ course, from, length }) => {
    const source = sources[course]!;
    const start = from % (source.codePoints.length - length);
    return { source, codePoints: source.codePoints.slice(start, start + length) };
  });

// Recopie comme le ferait une IA : autres espaces, autre casse, autres apostrophes.
function recopy(codePoints: readonly string[], picks: readonly number[]): string {
  return codePoints
    .map((cp, i) => {
      const pick = picks[i % picks.length]!;
      if (/\s/u.test(cp)) return ["", " ", "\n", "\u00A0", "  "][pick % 5]!;
      if (cp === "\u2019") return pick % 2 ? "'" : cp;
      if (cp === "'") return pick % 2 ? "\u2019" : cp;
      return pick % 2 ? cp.toUpperCase() : cp.toLowerCase();
    })
    .join("");
}

describe("propriétés", () => {
  it("canonicalize est idempotent", () => {
    fc.assert(fc.property(messyText, (text) => canonicalize(canonicalize(text)) === canonicalize(text)));
  });

  it("normalizeForMatch conserve la longueur en points de code", () => {
    fc.assert(fc.property(messyText, (text) => codePointLength(normalizeForMatch(text)) === codePointLength(text)));
  });

  it("tout passage retrouvé est exactement display_text[start, end), sans espace aux bords", () => {
    const claim = fc.oneof(
      messyText,
      realPassage.map((p) => p.codePoints.join("")),
    );
    fc.assert(
      fc.property(fc.nat({ max: sources.length - 1 }), claim, (i, claimed) => {
        const source = sources[i]!;
        const hit = locate(source, claimed);
        if (hit === null) return true;
        return (
          hit.quote.length > 0 &&
          hit.quote.trim() === hit.quote &&
          sliceCodePoints(source.displayText, hit.start, hit.end) === hit.quote
        );
      }),
    );
  });

  it("un vrai passage recopié avec d'autres espaces, casse et apostrophes est toujours retrouvé", () => {
    fc.assert(
      fc.property(realPassage, fc.array(fc.nat(), { minLength: 1, maxLength: 50 }), ({ source, codePoints }, picks) => {
        const claimed = recopy(codePoints, picks);
        const hit = locate(source, claimed);
        expect(hit).not.toBeNull();
        expect(compactNeedle(hit!.quote)).toBe(compactNeedle(claimed));
      }),
    );
  });

  it("un seul caractère inventé suffit à faire rejeter la citation", () => {
    fc.assert(
      fc.property(realPassage, fc.nat(), ({ source, codePoints }, at) => {
        const tampered = [...codePoints];
        tampered.splice(at % (tampered.length + 1), 0, "ǂ");
        return locate(source, tampered.join("")) === null;
      }),
    );
  });
});
