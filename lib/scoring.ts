import { Severity } from "@/lib/domain";
import type { AuditFindingInput } from "@/lib/types";

const severityWeight: Record<Severity, number> = {
  CRITICAL: 15,
  HIGH: 10,
  MEDIUM: 6,
  LOW: 3
};

export function computeScores(findings: AuditFindingInput[]) {
  const byArea = { SEO: 100, CONVERSION: 100, PERFORMANCE: 100 };
  for (const finding of findings) {
    byArea[finding.area] = Math.max(0, byArea[finding.area] - severityWeight[finding.severity]);
  }

  const overallScore = Math.round((byArea.SEO + byArea.CONVERSION + byArea.PERFORMANCE) / 3);
  return {
    overallScore,
    seoScore: byArea.SEO,
    convScore: byArea.CONVERSION,
    perfScore: byArea.PERFORMANCE
  };
}

export function topNeedleMovers(findings: AuditFindingInput[], cap = 10) {
  return [...findings].sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]).slice(0, cap);
}
