import { describe, expect, it } from "vitest";
import { compactNeedle, freezeText, NORMALIZER_VERSION, trimEdgeNoise } from "../../lib/citations";
import { COURSES } from "./fixtures/courses";

// Si l'un de ces tests casse, les règles de normalisation ont changé : les
// positions stockées pour les versions de cours existantes ne sont plus fiables.
// Mettre à jour les valeurs attendues ET incrémenter NORMALIZER_VERSION.

const EXPECTED_DISPLAY =
  "Chapitre 2 \u2013 La Révolution française (1789\u20131799)\n\n" +
  "I. La fin de la monarchie absolue\n" +
  "Le 5 mai 1789, Louis XVI réunit les états généraux à Versailles. Les députés du tiers état se proclament Assemblée nationale le 17 juin.\n" +
  "Le 14 juillet 1789, les Parisiens prennent la Bastille, symbole de l\u2019arbitraire royal.\n" +
  "Définition : la souveraineté nationale signifie que le pouvoir appartient à la nation et non plus au roi.\n\n" +
  "II. Les grands textes\n" +
  "La Déclaration des droits de l\u2019homme et du citoyen est adoptée le 26 août 1789. Son article 1 affirme : « Les hommes naissent et demeurent libres et égaux en droits. »\n" +
  "Qui détient le pouvoir ? Désormais, la loi est l\u2019expression de la volonté générale...\n" +
  "La monarchie constitutionnelle est établie en 1791. Le roi partage le pouvoir avec une Assemblée élue.\n" +
  "En 1792, la République est proclamée. En 1792, la République est proclamée après la chute du roi.";

describe(`règles figées (version ${NORMALIZER_VERSION})`, () => {
  it("version courante", () => {
    expect(NORMALIZER_VERSION).toBe(1);
  });

  it("texte canonique d'un cours issu d'un PDF", () => {
    expect(freezeText(COURSES[0]!.raw).displayText).toBe(EXPECTED_DISPLAY);
  });

  it("texte de comparaison", () => {
    expect(freezeText("L\u2019État « CO₂ » \u2014 10⁵").matchText).toBe("l'état \" co2 \" - 10⁵");
  });

  it("forme comparable d'une citation", () => {
    const needle = compactNeedle("« L\u2019État, c\u2019est moi\u2026 »");
    expect(needle).toBe("\"l'état,c'estmoi...\"");
    expect(trimEdgeNoise(needle)).toBe("l'état,c'estmoi");
  });
});

describe("freezeText", () => {
  it("donne deux textes de même longueur et la version des règles", () => {
    expect(freezeText("\u{1F4CC} CO₂\u00A0!")).toEqual({
      displayText: "\u{1F4CC} CO₂ !",
      matchText: "\u{1F4CC} co2 !",
      normalizerVersion: NORMALIZER_VERSION,
      length: 7,
    });
  });

  it("refuse un texte vide après nettoyage", () => {
    expect(() => freezeText(" \u200B\r\n ")).toThrow(/vide/);
  });
});
