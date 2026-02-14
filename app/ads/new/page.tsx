"use client";

import { useState } from "react";

export default function NewAdPage() {
  const [storeUrl, setStoreUrl] = useState("");
  const [productRef, setProductRef] = useState("");
  const [template, setTemplate] = useState("problemSolutionCta");
  const [format, setFormat] = useState("9:16");

  async function createProject() {
    const response = await fetch("/api/ads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeUrl, productRef, template, format })
    });
    const data = await response.json();
    if (data.id) window.location.href = "/ads";
  }

  return (
    <div className="card">
      <h1>Create Ad</h1>
      <input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="https://store.com" />
      <input value={productRef} onChange={(e) => setProductRef(e.target.value)} placeholder="Product URL or title" />
      <select value={template} onChange={(e) => setTemplate(e.target.value)}>
        <option value="problemSolutionCta">Problem → Solution → CTA</option>
        <option value="benefits3">3 Benefits</option>
        <option value="minimalPremium">Minimal Premium</option>
      </select>
      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="9:16">9:16</option>
        <option value="1:1">1:1</option>
        <option value="16:9">16:9</option>
      </select>
      <button onClick={createProject}>Create</button>
    </div>
  );
}
