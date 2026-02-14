import { FindingArea, Severity } from "@/lib/domain";
import { describe, expect, it } from "vitest";
import { computeScores } from "@/lib/scoring";

describe("computeScores", () => {
  it("applies severity deductions by area", () => {
    const scores = computeScores([
      { severity: Severity.CRITICAL, area: FindingArea.CONVERSION, url: "u", message: "m", recommendation: "r", howToApply: "h" },
      { severity: Severity.MEDIUM, area: FindingArea.SEO, url: "u", message: "m", recommendation: "r", howToApply: "h" }
    ]);

    expect(scores.convScore).toBe(85);
    expect(scores.seoScore).toBe(94);
    expect(scores.overallScore).toBeLessThan(100);
  });
});
