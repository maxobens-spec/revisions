import { describe, expect, it } from "vitest";
import { codePointLength, normalizeForMatch } from "../../lib/citations";

describe("normalizeForMatch", () => {
  it("met en minuscules sans toucher aux accents", () => {
    expect(normalizeForMatch("À ÉTÉ Été")).toBe("à été été");
  });

  it("unifie apostrophes, guillemets et tirets", () => {
    expect(normalizeForMatch("l\u2019a « b » \u201Cc\u201D \u2018d\u2019 \u2013 \u2014 \u2212 \u2011")).toBe(
      "l'a \" b \" \"c\" 'd' - - - -",
    );
  });

  it("ramène tout espace, retour à la ligne compris, à une espace", () => {
    expect(normalizeForMatch("a\nb\u00A0c\td")).toBe("a b c d");
  });

  it("confond les chiffres en indice avec les chiffres, pas les exposants", () => {
    expect(normalizeForMatch("CO₂ H₂O 10⁵ m²")).toBe("co2 h2o 10⁵ m²");
  });

  it("garde un caractère dont la minuscule ferait deux points de code", () => {
    expect(normalizeForMatch("İstanbul")).toBe("İstanbul");
  });

  it("conserve la longueur en points de code, emoji compris", () => {
    const text = "\u{1F4CC} Ça « marche » İ \u2014 CO₂";
    expect(codePointLength(normalizeForMatch(text))).toBe(codePointLength(text));
  });
});
