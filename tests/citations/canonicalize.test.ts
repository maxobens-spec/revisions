import { describe, expect, it } from "vitest";
import { canonicalize } from "../../lib/citations";

describe("canonicalize", () => {
  it("unifie les fins de ligne", () => {
    expect(canonicalize("a\r\nb\rc\u2028d\u2029e\u0085f\u000Bg\u000Ch")).toBe("a\nb\nc\nd\ne\nf\ng\nh");
  });

  it("retire césure conditionnelle, caractères invisibles et contrôles", () => {
    expect(canonicalize("constitu\u00ADtion\u200Bnelle\uFEFF\u0007")).toBe("constitutionnelle");
  });

  it("développe les ligatures des PDF, sans toucher à œ ni æ", () => {
    expect(canonicalize("signi\uFB01e \uFB02eur \uFB00et \uFB03 \uFB04 \uFB05 \uFB06 cœur ex æquo")).toBe(
      "signifie fleur ffet ffi ffl st st cœur ex æquo",
    );
  });

  it("remplace le caractère \u2026 par trois points", () => {
    expect(canonicalize("générale\u2026")).toBe("générale...");
  });

  it("compose les accents (NFC)", () => {
    const out = canonicalize("e\u0301lue");
    expect(out).toBe("élue");
    expect(out).toHaveLength(4);
  });

  it("réduit les espaces horizontaux, insécables compris, à une seule espace", () => {
    expect(canonicalize("Définition\u00A0:\tla   loi\u202F? oui\u2003non")).toBe("Définition : la loi ? oui non");
  });

  it("retire les espaces en bord de ligne et limite les lignes vides à une", () => {
    expect(canonicalize("  titre  \n \n\n\n  suite \n")).toBe("titre\n\nsuite");
  });

  it("ne recolle pas les césures de fin de ligne (ambigu : arc-en-ciel)", () => {
    expect(canonicalize("photo-\nsynthèse")).toBe("photo-\nsynthèse");
  });

  it("remplace un demi-caractère de substitution orphelin", () => {
    expect(canonicalize("a\uD800b")).toBe("a\uFFFDb");
  });
});
