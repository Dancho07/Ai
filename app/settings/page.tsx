export default function SettingsPage() {
  return (
    <div className="card">
      <h1>Settings</h1>
      <p>Configure API keys and feature toggles through environment variables.</p>
      <ul>
        <li>OPENAI_API_KEY for AI-enhanced copy/script generation.</li>
        <li>SHOPIFY_API_KEY / SHOPIFY_API_SECRET for OAuth connect.</li>
        <li>TOKEN_ENCRYPTION_KEY for token encryption at rest.</li>
        <li>CRAWL_MAX_PAGES / CRAWL_DELAY_MS to tune crawl politeness.</li>
      </ul>
    </div>
  );
}
