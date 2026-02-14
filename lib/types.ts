import { FindingArea, Severity } from "@/lib/domain";

export type AuditFindingInput = {
  severity: Severity;
  area: FindingArea;
  url: string;
  message: string;
  recommendation: string;
  howToApply: string;
};
