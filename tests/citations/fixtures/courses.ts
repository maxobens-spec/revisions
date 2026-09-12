// Cours de test écrits pour l'occasion (aucun extrait de manuel). Les défauts
// d'extraction sont volontaires : CRLF, insécables, césure conditionnelle,
// ligature de PDF, caractère « \u2026 », accent décomposé, emoji.
// Les vrais cours fournis (dont les photos de cahier) s'ajouteront ici, même format.

export type ClaimExpectation = "found" | "quote_found" | "quote_min_length";

export interface ClaimCase {
  readonly why: string;
  /** Ce que l'IA prétend citer. */
  readonly claimed: string;
  readonly expect: ClaimExpectation;
  /** Pour "found" : le passage exact attendu, tel qu'il est dans le texte canonique. */
  readonly passage?: string;
  readonly occurrences?: number;
}

export interface CourseFixture {
  readonly id: string;
  readonly subject: "histoire-geo" | "svt" | "physique-chimie" | "anglais";
  readonly level: "6e" | "5e" | "4e" | "3e";
  readonly origin: "pdf" | "photo" | "texte-colle";
  /** Texte brut tel qu'il sort de l'extraction, défauts compris. */
  readonly raw: string;
  readonly claims: readonly ClaimCase[];
}

export const COURSES: readonly CourseFixture[] = [
  {
    id: "revolution-francaise",
    subject: "histoire-geo",
    level: "4e",
    origin: "pdf",
    raw:
      "Chapitre 2 \u2013 La Révolution française (1789\u20131799)\r\n\r\n\r\n" +
      "I. La fin de la monarchie absolue\r\n" +
      "Le 5 mai 1789, Louis XVI réunit les états généraux à Versailles. Les députés du tiers état se proclament Assemblée nationale le 17 juin.\r\n" +
      "Le 14 juillet 1789, les Parisiens prennent la Bastille, symbole de l\u2019arbitraire royal.\r\n" +
      "Définition\u00A0: la souveraineté nationale signi\uFB01e que le pouvoir appartient à la nation et non plus au roi.\r\n\r\n" +
      "II. Les grands textes\r\n" +
      "La Déclaration des droits de l\u2019homme et du citoyen est adoptée le 26 août 1789. Son article 1 affirme\u00A0: «\u00A0Les hommes naissent et demeurent libres et égaux en droits.\u00A0»\r\n" +
      "Qui détient le pouvoir\u202F? Désormais, la loi est l\u2019expression de la volonté générale\u2026\r\n" +
      "La monarchie constitution\u00ADnelle est établie en 1791.\t Le roi partage le pouvoir avec une Assemblée e\u0301lue.  \r\n" +
      "En 1792, la République est proclamée. En 1792, la République est proclamée après la chute du roi.\r\n",
    claims: [
      {
        why: "citation exacte, point final compris",
        claimed: "Le 14 juillet 1789, les Parisiens prennent la Bastille, symbole de l\u2019arbitraire royal.",
        expect: "found",
        passage: "Le 14 juillet 1789, les Parisiens prennent la Bastille, symbole de l\u2019arbitraire royal.",
      },
      {
        why: "insécable avant « : » absente côté IA, minuscule initiale, ligature fi dans le PDF",
        claimed: "définition: la souveraineté nationale signifie que le pouvoir appartient à la nation",
        expect: "found",
        passage: "Définition : la souveraineté nationale signifie que le pouvoir appartient à la nation",
      },
      {
        why: "guillemets droits côté IA, chevrons et insécables dans le cours",
        claimed: '"Les hommes naissent et demeurent libres et égaux en droits."',
        expect: "found",
        passage: "« Les hommes naissent et demeurent libres et égaux en droits. »",
      },
      {
        why: "citation à cheval sur deux lignes",
        claimed: "symbole de l'arbitraire royal. Définition : la souveraineté",
        expect: "found",
        passage: "symbole de l\u2019arbitraire royal.\nDéfinition : la souveraineté",
      },
      {
        why: "caractère \u2026 côté IA, trois points dans le cours",
        claimed: "la loi est l'expression de la volonté générale\u2026",
        expect: "found",
        passage: "la loi est l\u2019expression de la volonté générale...",
      },
      {
        why: "césure conditionnelle invisible dans le PDF",
        claimed: "La monarchie constitutionnelle est établie en 1791",
        expect: "found",
        passage: "La monarchie constitutionnelle est établie en 1791",
      },
      {
        why: "accent décomposé (e + accent combinant) dans le PDF",
        claimed: "Le roi partage le pouvoir avec une Assemblée élue.",
        expect: "found",
        passage: "Le roi partage le pouvoir avec une Assemblée élue.",
      },
      {
        why: "majuscule initiale oubliée par l'IA",
        claimed: "les députés du tiers état se proclament Assemblée nationale",
        expect: "found",
        passage: "Les députés du tiers état se proclament Assemblée nationale",
      },
      {
        why: "guillemets ajoutés par l'IA autour d'un passage qui n'en a pas",
        claimed: "« Le 14 juillet 1789, les Parisiens prennent la Bastille »",
        expect: "found",
        passage: "Le 14 juillet 1789, les Parisiens prennent la Bastille",
      },
      {
        why: "[...] en tête de citation",
        claimed: "[...] symbole de l'arbitraire royal",
        expect: "found",
        passage: "symbole de l\u2019arbitraire royal",
      },
      {
        why: "passage présent deux fois : la première occurrence est retenue",
        claimed: "En 1792, la République est proclamée",
        expect: "found",
        passage: "En 1792, la République est proclamée",
        occurrences: 2,
      },
      {
        why: "paraphrase (s'emparent au lieu de prennent) : rejetée",
        claimed: "Le 14 juillet 1789, les Parisiens s'emparent de la Bastille",
        expect: "quote_found",
      },
      {
        why: "accent oublié par l'IA (a au lieu de à) : rejeté",
        claimed: "la souveraineté nationale signifie que le pouvoir appartient a la nation",
        expect: "quote_found",
      },
      {
        why: "citation recousue avec [...] au milieu : rejetée",
        claimed: "Le 5 mai 1789 [...] Assemblée nationale le 17 juin",
        expect: "quote_found",
      },
      {
        why: "fait historique exact mais absent du cours : rejeté",
        claimed: "La Terreur fait des milliers de victimes entre 1793 et 1794.",
        expect: "quote_found",
      },
      { why: "trop court pour ancrer une question", claimed: "la Bastille", expect: "quote_min_length" },
      { why: "24 caractères : juste sous le seuil", claimed: "Qui détient le pouvoir?", expect: "quote_min_length" },
    ],
  },
  {
    id: "respiration",
    subject: "svt",
    level: "5e",
    origin: "photo",
    raw:
      "LA RESPIRATION\n" +
      "Objectif : comprendre comment l'organisme\nrécupère le dioxygène.\n\n" +
      "1) Les mouvements respiratoires\n" +
      "- L'inspiration : l'air entre dans les poumons.\n" +
      "- L'expiration : l'air sort des poumons.\n\n" +
      "2) Les échanges gazeux\n" +
      "Au niveau des alvéoles pulmonaires, le dioxygène (O₂) passe de l'air\nvers le sang.\n" +
      "Le dioxyde de carbone (CO₂) passe du sang vers l'air → il est rejeté\nlors de l'expiration.\n\n" +
      "A retenir : les échanges gazeux se font à travers la paroi très fine des alvéoles.\n",
    claims: [
      {
        why: "apostrophe courbe côté IA, droite dans l'OCR, ligne recollée",
        claimed: "Au niveau des alvéoles pulmonaires, le dioxygène (O₂) passe de l\u2019air vers le sang",
        expect: "found",
        passage: "Au niveau des alvéoles pulmonaires, le dioxygène (O₂) passe de l'air\nvers le sang",
      },
      {
        why: "CO2 sans indice côté IA : même passage que CO₂",
        claimed: "le dioxyde de carbone (CO2) passe du sang vers l\u2019air",
        expect: "found",
        passage: "Le dioxyde de carbone (CO₂) passe du sang vers l'air",
      },
      {
        why: "ligne de liste citée avec son point final",
        claimed: "L\u2019inspiration : l\u2019air entre dans les poumons.",
        expect: "found",
        passage: "L'inspiration : l'air entre dans les poumons.",
      },
      {
        why: "citation à cheval sur un retour à la ligne, avec une flèche",
        claimed: "passe du sang vers l'air → il est rejeté lors de l'expiration",
        expect: "found",
        passage: "passe du sang vers l'air → il est rejeté\nlors de l'expiration",
      },
      {
        why: "l'IA corrige la faute de l'élève (A devient À) : rejeté, le cours dit « A retenir »",
        claimed: "À retenir : les échanges gazeux se font à travers la paroi très fine des alvéoles",
        expect: "quote_found",
      },
      {
        why: "fait exact mais absent du cours : rejeté",
        claimed: "Le sang oxygéné est transporté par les globules rouges grâce à l'hémoglobine.",
        expect: "quote_found",
      },
    ],
  },
  {
    id: "etats-de-la-matiere",
    subject: "physique-chimie",
    level: "4e",
    origin: "texte-colle",
    raw:
      "\u{1F4CC} Les états de la matière\n\n" +
      "La matière existe sous trois états : solide, liquide et gazeux.\n" +
      "Le passage de l\u2019état solide à l\u2019état liquide s\u2019appelle la fusion ; l\u2019eau pure fond à 0\u00A0°C.\n" +
      "Le passage de l\u2019état liquide à l\u2019état gazeux s\u2019appelle la vaporisation \u2014 l\u2019eau pure bout à 100\u00A0°C sous la pression atmosphérique normale.\n" +
      "Au cours d\u2019un changement d\u2019état, la masse se conserve mais le volume varie.\n" +
      "Température de solidification de l\u2019eau : 0 °C ; à \u221218 °C, l\u2019eau est solide.\n" +
      "Un litre d\u2019eau liquide a une masse d\u2019environ 1 kg ; son volume est de 1 dm³.\n",
    claims: [
      {
        why: "insécable avant °C dans le cours, apostrophes droites côté IA",
        claimed: "l'eau pure bout à 100 °C sous la pression atmosphérique normale",
        expect: "found",
        passage: "l\u2019eau pure bout à 100 °C sous la pression atmosphérique normale",
      },
      {
        why: "trait d'union côté IA, tiret cadratin dans le cours",
        claimed: "s'appelle la vaporisation - l'eau pure bout",
        expect: "found",
        passage: "s\u2019appelle la vaporisation \u2014 l\u2019eau pure bout",
      },
      {
        why: "trait d'union côté IA, signe moins typographique dans le cours",
        claimed: "à -18 °C, l'eau est solide",
        expect: "found",
        passage: "à \u221218 °C, l\u2019eau est solide",
      },
      { why: "trop court pour ancrer une question", claimed: "la fusion", expect: "quote_min_length" },
      { why: "24 caractères : juste sous le seuil", claimed: "l'eau pure bout à 100 °C", expect: "quote_min_length" },
      {
        why: "un nombre changé : rejeté",
        claimed: "l'eau pure bout à 90 °C sous la pression atmosphérique normale",
        expect: "quote_found",
      },
      {
        why: "exposant significatif (dm3 contre dm³) : rejeté, l'IA régénère",
        claimed: "Un litre d'eau liquide a une masse d'environ 1 kg ; son volume est de 1 dm3",
        expect: "quote_found",
      },
    ],
  },
  {
    id: "present-perfect",
    subject: "anglais",
    level: "5e",
    origin: "photo",
    raw:
      "ANGLAIS \u2013 The present perfect\n\n" +
      "Formation : have / has + participe passé (V-ed ou 3e colonne).\n" +
      "On l\u2019utilise pour une action passée qui a un lien avec le présent.\n" +
      "Ex : I have lost my keys. (= je ne les ai toujours pas)\n" +
      "Ex : She has never been to London.\n" +
      "Ex : It\u2019s the first time I\u2019ve seen snow.\n" +
      "Mots-clés : ever, never, already, yet, just.\n" +
      "Attention : on ne l\u2019emploie pas avec une date précise → I visited London in 2019.\n",
    claims: [
      {
        why: "phrase d'exemple citée avec son point final",
        claimed: "She has never been to London.",
        expect: "found",
        passage: "She has never been to London.",
      },
      {
        why: "parenthèse et signe égal gardés tels quels",
        claimed: "I have lost my keys. (= je ne les ai toujours pas)",
        expect: "found",
        passage: "I have lost my keys. (= je ne les ai toujours pas)",
      },
      {
        why: "contractions anglaises : apostrophes droites côté IA",
        claimed: "It's the first time I've seen snow",
        expect: "found",
        passage: "It\u2019s the first time I\u2019ve seen snow",
      },
      {
        why: "français et anglais mêlés, avec une flèche",
        claimed: "on ne l'emploie pas avec une date précise → I visited London in 2019",
        expect: "found",
        passage: "on ne l\u2019emploie pas avec une date précise → I visited London in 2019",
      },
      {
        why: "un mot anglais changé (gone au lieu de been) : rejeté",
        claimed: "She has never gone to London.",
        expect: "quote_found",
      },
      {
        why: "un mot français changé (jamais au lieu de pas) : rejeté",
        claimed: "on ne l'emploie jamais avec une date précise",
        expect: "quote_found",
      },
    ],
  },
];
