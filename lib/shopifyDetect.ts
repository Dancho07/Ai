import * as cheerio from "cheerio";

export async function detectShopifySignals(url: string): Promise<{ isShopify: boolean; signals: string[] }> {
  const res = await fetch(url, { headers: { "user-agent": "StoreOptimizerBot/1.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const signals: string[] = [];

  if (html.includes("cdn.shopify.com")) signals.push("cdn_assets");
  if ($('meta[name="generator"]').attr("content")?.toLowerCase().includes("shopify")) {
    signals.push("meta_generator");
  }
  if (html.includes('/collections') || html.includes('/products')) signals.push("shop_routes");
  if ($('script[type="application/ld+json"]').text().toLowerCase().includes('"@type":"product"')) {
    signals.push("product_schema");
  }

  return { isShopify: signals.length >= 2, signals };
}
