import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runPublicAudit } from "@/lib/audit";
import { normalizeStoreUrl } from "@/lib/url";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const storeUrl = normalizeStoreUrl(body.url);
    const audit = await runPublicAudit(storeUrl);

    const scan = await prisma.scan.create({
      data: {
        storeUrl,
        overallScore: audit.overallScore,
        seoScore: audit.seoScore,
        convScore: audit.convScore,
        perfScore: audit.perfScore,
        summaryJson: {
          topFixes: audit.topFixes,
          isShopify: audit.isShopify,
          signals: audit.shopifySignals,
          robotsTxt: audit.robotsTxt,
          performance: audit.performance
        },
        pageResults: { create: audit.pageResults as never[] },
        findings: { create: audit.findings }
      }
    });

    return NextResponse.json({ id: scan.id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
