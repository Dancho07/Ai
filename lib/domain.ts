export const Severity = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];

export const FindingArea = {
  SEO: "SEO",
  CONVERSION: "CONVERSION",
  PERFORMANCE: "PERFORMANCE"
} as const;

export type FindingArea = (typeof FindingArea)[keyof typeof FindingArea];
