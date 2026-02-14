import { describe, expect, it } from "vitest";
import { normalizeStoreUrl } from "@/lib/url";

describe("normalizeStoreUrl", () => {
  it("normalizes and trims path", () => {
    expect(normalizeStoreUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("blocks localhost SSRF", () => {
    expect(() => normalizeStoreUrl("https://localhost:3000")).toThrow();
  });

  it("requires https", () => {
    expect(() => normalizeStoreUrl("http://example.com")).toThrow();
  });
});
