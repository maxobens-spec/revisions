import { describe, expect, it } from "vitest";
import { freezeText, prepareSource, sliceCodePoints, verifyCitation } from "../../lib/citations";
import { COURSES } from "./fixtures/courses";

describe.each(COURSES)("cours $id ($subject $level, $origin)", (course) => {
  const frozen = freezeText(course.raw);
  const source = prepareSource(frozen.displayText);

  it.each(course.claims)("$why", (claim) => {
    const verdict = verifyCitation(source, claim.claimed);
    if (claim.expect !== "found") {
      expect(verdict).toMatchObject({ ok: false, failed: claim.expect });
      return;
    }
    if (!verdict.ok) throw new Error(`rejetée à tort (${verdict.failed}) : ${claim.claimed}`);
    expect(verdict.quote).toBe(claim.passage);
    expect(sliceCodePoints(frozen.displayText, verdict.start, verdict.end)).toBe(claim.passage);
    if (claim.occurrences !== undefined) expect(verdict.occurrences).toBe(claim.occurrences);
  });
});
