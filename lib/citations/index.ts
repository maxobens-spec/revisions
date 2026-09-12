export { canonicalize } from "./canonicalize";
export { codePointLength, sliceCodePoints } from "./codepoints";
export { freezeText, NORMALIZER_VERSION, type FrozenText } from "./freeze";
export {
  compactNeedle,
  locate,
  prepareSource,
  trimEdgeNoise,
  type Location,
  type PreparedSource,
} from "./locate";
export { normalizeCodePoint, normalizeForMatch } from "./normalize";
export {
  MIN_QUOTE_LENGTH,
  verifyCitation,
  type CitationCheck,
  type CitationCheckKind,
  type CitationVerdict,
  type VerifyOptions,
} from "./verify";
