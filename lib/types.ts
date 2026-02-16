import { FindingArea, Severity } from "@/lib/domain";

export type AuditFindingInput = {
  severity: Severity;
  area: FindingArea;
  url: string;
  message: string;
  recommendation: string;
  howToApply: string;
};

export type AuditPageResultInput = {
  url: string;
  title: string | null;
  metaDesc: string | null;
  h1: string | null;
  ogJson: Record<string, string | undefined>;
  altCoverage: number;
  structuredDataPresent: boolean;
  brokenLinksCount: number;
};
