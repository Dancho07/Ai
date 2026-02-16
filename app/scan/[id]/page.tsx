export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ScanDetails({ params }: { params: { id: string } }) {
  const scan = await prisma.scan.findUnique({
    where: { id: params.id },
    include: { findings: true, pageResults: true }
  });

  if (!scan) return <div>Scan not found.</div>;

  const top10 = [...scan.findings].slice(0, 10);

  return (
    <div>
      <h1>Audit Dashboard</h1>
      <p className="small">Public scan cannot change your store. Connect Shopify to apply fixes.</p>
      <div className="grid">
        <div className="card"><h3>Overall</h3><strong>{scan.overallScore}</strong></div>
        <div className="card"><h3>SEO</h3><strong>{scan.seoScore}</strong></div>
        <div className="card"><h3>Conversion</h3><strong>{scan.convScore}</strong></div>
        <div className="card"><h3>Performance</h3><strong>{scan.perfScore}</strong></div>
      </div>

      <div className="card">
        <h2>Top 10 fixes that move the needle</h2>
        {top10.map((f) => (
          <div key={f.id}>
            <span className="badge">{f.severity}</span>
            <span className="badge">{f.area}</span>
            <p><strong>{f.message}</strong></p>
            <p>{f.recommendation}</p>
            <p className="small">How to apply: {f.howToApply}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Improvement Pack</h2>
        <Link href={`/api/scan/${scan.id}/export?format=json`}>Download JSON</Link>
        <Link href={`/api/scan/${scan.id}/export?format=csv`}>Download CSV</Link>
      </div>

      <Link href={`/connect?scanId=${scan.id}`}>Connect Shopify to Apply Fixes</Link>
    </div>
  );
}
