import * as cheerio from "cheerio";

const toAbsolute = (base: string, value: string) => new URL(value, base).toString();

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: { "user-agent": "StoreOptimizerBot/1.0" } });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export async function fetchRobots(baseUrl: string): Promise<string> {
  const robots = await fetchText(new URL("/robots.txt", baseUrl).toString());
  return robots ?? "";
}

export async function collectSitemapUrls(baseUrl: string, max = 50): Promise<string[]> {
  const root = new URL(baseUrl);
  const visited = new Set<string>();
  const urls = new Set<string>([root.toString()]);
  const queue = [new URL("/sitemap.xml", root).toString()];

  while (queue.length && urls.size < max) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const body = await fetchText(current);
    if (!body) continue;

    const $ = cheerio.load(body, { xmlMode: true });
    const locs = $("loc").toArray().map((e) => $(e).text().trim()).filter(Boolean);

    if ($("sitemapindex").length) {
      locs.forEach((loc) => queue.push(toAbsolute(baseUrl, loc)));
      continue;
    }

    locs.forEach((loc) => {
      const normalized = toAbsolute(baseUrl, loc);
      if (normalized.startsWith(root.origin)) urls.add(normalized);
    });
  }

  return Array.from(urls).slice(0, max);
}
