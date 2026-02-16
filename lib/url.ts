const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const PRIVATE_IP_RANGES = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[0-1])\./, /^192\.168\./];

export function normalizeStoreUrl(raw: string): string {
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https URLs are allowed.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Please provide an HTTPS storefront URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error("Local/internal hosts are not allowed.");
  }

  if (PRIVATE_IP_RANGES.some((range) => range.test(hostname))) {
    throw new Error("Private IP ranges are blocked.");
  }

  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/$/, "");

  return parsed.toString();
}
