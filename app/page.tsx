"use client";

import { useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    setLoading(false);
    if (data.id) window.location.href = `/scan/${data.id}`;
    else alert(data.error ?? "Scan failed");
  }

  return (
    <section className="card">
      <h1>Paste your Shopify store URL</h1>
      <p className="small">Public scan uses only storefront HTML + robots/sitemap data. It cannot modify your store unless you connect Shopify.</p>
      <label htmlFor="store-url">Store URL (e.g., https://example.com)</label>
      <input id="store-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
      <button onClick={scan} disabled={loading}>{loading ? "Scanning…" : "Scan Store"}</button>
    </section>
  );
}
