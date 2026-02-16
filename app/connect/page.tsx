"use client";

import { useState } from "react";

export default function ConnectPage() {
  const [shopDomain, setShopDomain] = useState("");
  const [writeProducts, setWriteProducts] = useState(false);
  const [writeThemes, setWriteThemes] = useState(false);

  async function start() {
    const res = await fetch("/api/connect/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shopDomain, writeProducts, writeThemes })
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="card">
      <h1>Connect Shopify</h1>
      <p className="small">Required for one-click apply. We never modify stores from URL-only scans.</p>
      <input value={shopDomain} onChange={(e) => setShopDomain(e.target.value)} placeholder="example.myshopify.com" />
      <label><input type="checkbox" checked={writeProducts} onChange={(e) => setWriteProducts(e.target.checked)} /> Request write_products for one-click product updates</label>
      <label><input type="checkbox" checked={writeThemes} onChange={(e) => setWriteThemes(e.target.checked)} /> Advanced: request write_themes (off by default)</label>
      <button onClick={start}>Start OAuth</button>
    </div>
  );
}
