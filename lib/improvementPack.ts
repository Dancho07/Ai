import { stringify } from "csv-stringify/sync";
import type { AuditFindingInput } from "@/lib/types";
import { getAiProvider } from "@/lib/ai";

export function findingsToCsv(findings: AuditFindingInput[]): string {
  return stringify(findings, { header: true });
}

export function findingsToJson(findings: AuditFindingInput[]): string {
  return JSON.stringify(findings, null, 2);
}

export async function generateCopyPack(nicheHint: string) {
  const ai = getAiProvider();
  const prompt = `Generate concise ecommerce copy pack for niche: ${nicheHint}. Include product title patterns, meta description templates, FAQ templates, and 30-day blog/social calendar.`;
  const generated = await ai.generateCopy(prompt);
  return {
    niche: nicheHint,
    content: generated
  };
}

export function buildUtmUrl(base: string, source: string, medium: string, campaign: string) {
  const url = new URL(base);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}
