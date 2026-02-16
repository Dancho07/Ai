import type { AuditFindingInput } from "@/lib/types";

export type PageResultRecord = {
  id: string;
  scanId: string;
  url: string;
  title: string | null;
  metaDesc: string | null;
  h1: string | null;
  ogJson: Record<string, string | undefined> | null;
  altCoverage: number | null;
  structuredDataPresent: boolean;
  brokenLinksCount: number;
  createdAt: Date;
};

export type FindingRecord = AuditFindingInput & {
  id: string;
  scanId: string;
  createdAt: Date;
  resolvedAt: Date | null;
};

export type ScanRecord = {
  id: string;
  storeUrl: string;
  createdAt: Date;
  overallScore: number;
  seoScore: number;
  convScore: number;
  perfScore: number;
  summaryJson: Record<string, unknown>;
  findings: FindingRecord[];
  pageResults: PageResultRecord[];
};

export type ShopRecord = {
  id: string;
  shopDomain: string;
  accessTokenEncrypted: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ActionLogRecord = {
  id: string;
  shopId: string;
  actionType: string;
  payloadJson: Record<string, unknown>;
  createdAt: Date;
};

export type AdProjectRecord = {
  id: string;
  storeUrl: string;
  shopIdNullable: string | null;
  productRef: string;
  template: string;
  format: string;
  script: string;
  captionsJson: Record<string, unknown>;
  status: "QUEUED" | "RENDERING" | "COMPLETE" | "FAILED";
  outputFilePath: string | null;
  createdAt: Date;
};
