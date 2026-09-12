import { describe, expect, it } from "vitest";
import { freezeText, locate, prepareSource, sliceCodePoints } from "../../lib/citations";

const source = prepareSource(
  freezeText(
    "Le 14 juillet 1789, les Parisiens prennent la Bastille.\n" +
      "En 1792, la République est proclamée. En 1792, la République est proclamée après la chute du roi.",
  ).displayText,
);

describe("prepareSource", () => {
  it("refuse un texte non canonique", () => {
    expect(() => prepareSource("texte  brut\r\n")).toThrow(/canonique/);
  });
});

describe("locate", () => {
  it("renvoie le passage tel qu'il est dans le cours, pas la citation de l'IA", () => {
    expect(locate(source, "LES PARISIENS  prennent\nla bastille")?.quote).toBe("les Parisiens prennent la Bastille");
  });

  it("renvoie null pour une citation vide ou faite d'espaces", () => {
    expect(locate(source, "")).toBeNull();
    expect(locate(source, " \n\t ")).toBeNull();
  });

  it("garde la ponctuation des bords quand la citation telle quelle est trouvée", () => {
    expect(locate(source, "prennent la Bastille.")?.quote).toBe("prennent la Bastille.");
  });

  it("ne retire la ponctuation des bords que si la citation telle quelle est introuvable", () => {
    expect(locate(source, "« prennent la Bastille »")?.quote).toBe("prennent la Bastille");
    expect(locate(source, "[...] prennent la Bastille")?.quote).toBe("prennent la Bastille");
  });

  it("ne tolère aucune coupure au milieu", () => {
    expect(locate(source, "Le 14 juillet [...] la Bastille")).toBeNull();
  });

  it("compte les occurrences et retient la première", () => {
    const hit = locate(source, "la République est proclamée");
    expect(hit).toMatchObject({ occurrences: 2, quote: "la République est proclamée" });
    expect(hit!.start).toBe(source.displayText.indexOf("la République"));
  });

  it("donne des positions en points de code, comme substring() en Postgres", () => {
    const withEmoji = prepareSource("\u{1F4CC} Les états de la matière");
    const hit = locate(withEmoji, "les états")!;
    expect(hit).toMatchObject({ start: 2, end: 11 });
    expect(sliceCodePoints(withEmoji.displayText, hit.start, hit.end)).toBe("Les états");
    // Le piège évité : .slice() compte l'emoji pour deux unités.
    expect(withEmoji.displayText.slice(hit.start, hit.end)).not.toBe("Les états");
  });
});
