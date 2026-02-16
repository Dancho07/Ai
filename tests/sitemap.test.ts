import { describe, expect, it, vi } from "vitest";
import { collectSitemapUrls } from "@/lib/sitemap";

describe("collectSitemapUrls", () => {
  it("parses sitemap index and urlset", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();
      if (url.endsWith("/sitemap.xml")) {
        return new Response(`<?xml version="1.0"?><sitemapindex><sitemap><loc>https://shop.com/sitemap-products.xml</loc></sitemap></sitemapindex>`);
      }
      return new Response(`<?xml version="1.0"?><urlset><url><loc>https://shop.com/products/a</loc></url><url><loc>https://shop.com/collections/all</loc></url></urlset>`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const urls = await collectSitemapUrls("https://shop.com", 10);
    expect(urls).toContain("https://shop.com/products/a");
    expect(urls).toContain("https://shop.com/collections/all");
  });
});
