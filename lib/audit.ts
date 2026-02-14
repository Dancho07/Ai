import * as cheerio from "cheerio";
import PQueue from "p-queue";
import { chromium } from "playwright";
import { FindingArea, Severity } from "@/lib/domain";
import { collectSitemapUrls, fetchRobots } from "@/lib/sitemap";
import { detectShopifySignals } from "@/lib/shopifyDetect";
import { computeScores, topNeedleMovers } from "@/lib/scoring";
import type { AuditFindingInput } from "@/lib/types";

const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES ?? 50);
const DELAY = Number(process.env.CRAWL_DELAY_MS ?? 400);

function finding(input: AuditFindingInput): AuditFindingInput {
  return input;
}

export async function runPublicAudit(storeUrl: string) {
  const robotsTxt = await fetchRobots(storeUrl);
  const urls = await collectSitemapUrls(storeUrl, MAX_PAGES);
  const detection = await detectShopifySignals(storeUrl);
  const queue = new PQueue({ concurrency: 3, interval: DELAY, intervalCap: 1 });

  const findings: AuditFindingInput[] = [];
  const pageResults: Array<Record<string, unknown>> = [];

  await Promise.all(
    urls.map((url) =>
      queue.add(async () => {
        const response = await fetch(url, { headers: { "user-agent": "StoreOptimizerBot/1.0" } });
        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $("title").first().text().trim();
        const metaDesc = $('meta[name="description"]').attr("content")?.trim() ?? null;
        const h1Count = $("h1").length;
        const hasCanonical = $('link[rel="canonical"]').length > 0;
        const ogTitle = $('meta[property="og:title"]').attr("content");
        const ogImage = $('meta[property="og:image"]').attr("content");
        const images = $("img").toArray();
        const withAlt = images.filter((img) => ($(img).attr("alt") ?? "").trim().length > 0).length;
        const altCoverage = images.length ? withAlt / images.length : 1;
        const structuredDataPresent = $('script[type="application/ld+json"]').length > 0;
        const brokenLinksCount = 0;

        if (!title || title.length < 20 || title.length > 65) {
          findings.push(
            finding({
              severity: Severity.MEDIUM,
              area: FindingArea.SEO,
              url,
              message: "Title tag is missing or outside ideal length (20-65 chars).",
              recommendation: "Rewrite title with product/category keyword + value prop.",
              howToApply: "Copy/paste in Shopify admin SEO preview, or connect Shopify for one-click updates."
            })
          );
        }

        if (!metaDesc || metaDesc.length < 70 || metaDesc.length > 160) {
          findings.push(
            finding({
              severity: Severity.MEDIUM,
              area: FindingArea.SEO,
              url,
              message: "Meta description missing or weak.",
              recommendation: "Use 140-160 chars with USP + CTA.",
              howToApply: "Copy/paste in page SEO fields or use connected apply mode."
            })
          );
        }

        if (h1Count !== 1) {
          findings.push(
            finding({
              severity: Severity.HIGH,
              area: FindingArea.SEO,
              url,
              message: `Expected exactly one H1; found ${h1Count}.`,
              recommendation: "Keep one clear H1 mirroring user intent.",
              howToApply: "Adjust theme templates manually; theme-write is advanced and off by default."
            })
          );
        }

        if (!hasCanonical) {
          findings.push(
            finding({
              severity: Severity.HIGH,
              area: FindingArea.SEO,
              url,
              message: "Canonical URL is missing.",
              recommendation: "Add canonical tags to avoid duplicate content conflicts.",
              howToApply: "Theme/app setting update. Connect Shopify + theme toggle for guided implementation."
            })
          );
        }

        if (!ogTitle || !ogImage) {
          findings.push(
            finding({
              severity: Severity.LOW,
              area: FindingArea.CONVERSION,
              url,
              message: "Open Graph tags are incomplete for social sharing.",
              recommendation: "Set og:title and og:image for key pages.",
              howToApply: "Update SEO/social fields or use one-click where available."
            })
          );
        }

        if (altCoverage < 0.8) {
          findings.push(
            finding({
              severity: Severity.MEDIUM,
              area: FindingArea.SEO,
              url,
              message: `Image alt text coverage is ${(altCoverage * 100).toFixed(0)}%.`,
              recommendation: "Add descriptive alt text for product and hero images.",
              howToApply: "Copy pack provides alt templates; one-click apply available after Shopify connect."
            })
          );
        }

        if (url.includes("/products/") && !html.toLowerCase().includes("add to cart")) {
          findings.push(
            finding({
              severity: Severity.CRITICAL,
              area: FindingArea.CONVERSION,
              url,
              message: "Primary add-to-cart CTA not detected.",
              recommendation: "Ensure sticky visible CTA above fold on product pages.",
              howToApply: "Theme/component update required."
            })
          );
        }

        pageResults.push({
          url,
          title,
          metaDesc,
          h1: $("h1").first().text().trim() || null,
          ogJson: { title: ogTitle, image: ogImage },
          altCoverage,
          structuredDataPresent,
          brokenLinksCount
        });
      })
    )
  );

  const performance = await collectPerformanceSnapshot(urls);
  for (const p of performance.opportunities) {
    findings.push(
      finding({
        severity: Severity.MEDIUM,
        area: FindingArea.PERFORMANCE,
        url: p.url,
        message: p.message,
        recommendation: p.recommendation,
        howToApply: "Compress media, defer scripts, and optimize theme/app embeds."
      })
    );
  }

  const scores = computeScores(findings);

  return {
    robotsTxt,
    scannedUrls: urls,
    isShopify: detection.isShopify,
    shopifySignals: detection.signals,
    pageResults,
    findings,
    performance,
    ...scores,
    topFixes: topNeedleMovers(findings, 10)
  };
}

async function collectPerformanceSnapshot(urls: string[]) {
  const targets = urls.slice(0, 3);
  const browser = await chromium.launch({ headless: true });
  const opportunities: Array<{ url: string; message: string; recommendation: string }> = [];
  const snapshots: Array<{ url: string; loadMs: number }> = [];

  try {
    for (const url of targets) {
      const page = await browser.newPage();
      const start = Date.now();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      const loadMs = Date.now() - start;
      snapshots.push({ url, loadMs });

      if (loadMs > 3500) {
        opportunities.push({
          url,
          message: `Page loads in ${loadMs}ms, above target 3500ms.`,
          recommendation: "Reduce JS payload and optimize images/CSS delivery."
        });
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  return { snapshots, opportunities };
}
