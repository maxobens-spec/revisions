import { describe, expect, it } from "vitest";
import { freezeText, MIN_QUOTE_LENGTH, prepareSource, verifyCitation } from "../../lib/citations";

const source = prepareSource(
  freezeText("Ex : She has never been to London.\nMots-clés : ever, never, already, yet, just.").displayText,
);
const SENTENCE = "She has never been to London.";

describe("verifyCitation", () => {
  it("seuil de 25 caractères par défaut : 25 passe, 24 échoue", () => {
    expect(MIN_QUOTE_LENGTH).toBe(25);
    expect(verifyCitation(source, "has never been to London.")).toMatchObject({
      ok: true,
      quote: "has never been to London.",
    });
    expect(verifyCitation(source, "has never been to London")).toMatchObject({ ok: false, failed: "quote_min_length" });
  });

  it("accepte un seuil explicite", () => {
    expect(verifyCitation(source, "London", { minLength: 6 })).toMatchObject({ ok: true, quote: "London" });
  });

  it("s'arrête au premier contrôle échoué", () => {
    const verdict = verifyCitation(source, "She has never gone to London.");
    expect(verdict).toMatchObject({ ok: false, failed: "quote_found" });
    expect(verdict.checks.map((check) => [check.kind, check.passed])).toEqual([["quote_found", false]]);
  });

  it("ne vérifie pas la réponse quand aucune n'est attendue (réponse ouverte)", () => {
    expect(verifyCitation(source, SENTENCE).checks.map((check) => check.kind)).toEqual([
      "quote_found",
      "quote_min_length",
    ]);
    expect(verifyCitation(source, SENTENCE, { answersInQuote: [] }).checks).toHaveLength(2);
  });

  it("texte à trous : la réponse attendue doit figurer dans le passage", () => {
    expect(verifyCitation(source, SENTENCE, { answersInQuote: ["been"] })).toMatchObject({ ok: true });
    const wrong = verifyCitation(source, SENTENCE, { answersInQuote: ["gone"] });
    expect(wrong).toMatchObject({ ok: false, failed: "answer_in_quote" });
    expect(wrong.checks.map((check) => check.passed)).toEqual([true, true, false]);
  });

  it("une variante suffit, ponctuation des bords ignorée, réponse vide refusée", () => {
    expect(verifyCitation(source, SENTENCE, { answersInQuote: ["gone", "Been."] })).toMatchObject({ ok: true });
    expect(verifyCitation(source, SENTENCE, { answersInQuote: [" ", "..."] })).toMatchObject({
      ok: false,
      failed: "answer_in_quote",
    });
  });
});
