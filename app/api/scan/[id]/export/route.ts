import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findingsToCsv, findingsToJson, generateCopyPack } from "@/lib/improvementPack";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const scan = await prisma.scan.findUnique({ where: { id: params.id }, include: { findings: true, pageResults: true } });
  if (!scan) return new NextResponse("Not found", { status: 404 });

  const url = new URL(_.url);
  const format = url.searchParams.get("format") ?? "json";
  const nicheHint = scan.pageResults.map((r) => r.title).filter(Boolean).slice(0, 8).join(", ");
  const copyPack = await generateCopyPack(nicheHint || "general ecommerce");

  if (format === "csv") {
    const csv = findingsToCsv(scan.findings);
    return new NextResponse(csv, {
      headers: { "content-type": "text/csv", "content-disposition": `attachment; filename=scan-${scan.id}.csv` }
    });
  }

  const payload = { findings: JSON.parse(findingsToJson(scan.findings)), copyPack };
  return NextResponse.json(payload, {
    headers: { "content-disposition": `attachment; filename=scan-${scan.id}.json` }
  });
}
