# StoreOptimizer Link Mode

A Next.js + TypeScript web app for no-friction Shopify growth audits:

- **Public Scan (URL only)**: crawls only public storefront assets (HTML, robots.txt, sitemap.xml) and produces SEO / conversion / performance findings.
- **Improvement Pack**: JSON/CSV export, copy templates, niche-aware content ideas, and UTM builder utility.
- **Optional Shopify Connect**: OAuth install with minimal scopes enables one-click apply actions (never available from URL-only mode).
- **Video Ads Studio**: generate ad scripts/projects from products in public or connected mode, then render MP4 output artifacts.

## Compliance commitments

- URL-only scans **cannot modify** a store.
- One-click apply requires explicit **Connect Shopify** OAuth flow.
- Crawl is polite: rate-limited queue + page cap.
- Internal/private host SSRF protections are enforced.
- No black-hat SEO, fake engagement, or bot traffic generation.

## Stack

- Next.js 14 (App Router), TypeScript.
- Prisma ORM with SQLite in dev and Postgres-ready model.
- Crawl + parsing: Playwright, p-queue, cheerio.
- AI: OpenAI optional via `AiProvider`; falls back to deterministic templates.

## Quick start

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

See `.env.example`:

- `DATABASE_PROVIDER` (`sqlite` in dev; set `postgresql` for production)
- `DATABASE_URL`
- `OPENAI_API_KEY` (optional)
- `APP_URL`
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `CRAWL_MAX_PAGES`, `CRAWL_DELAY_MS`

## Public scan flow

1. Validate and normalize store URL (HTTPS only + SSRF guard).
2. Fetch `robots.txt` + `sitemap.xml` (and sitemap index expansion).
3. Build URL list (capped at 50 by default).
4. Run SEO/conversion checks per page.
5. Run lightweight performance snapshot (home/product/collection candidates).
6. Persist findings with severity + area and compute overall/sub-scores.

## Why connect Shopify for applying fixes

Only after OAuth can we call Shopify Admin GraphQL API to apply actions like product title updates.

Default scopes:
- `read_products`
- `read_content` (optional read context)

Optional scopes:
- `write_products` for one-click product updates
- `write_themes` only via explicit advanced toggle

Tokens are encrypted at rest and all apply actions are recorded in `ActionLog` with payload snapshots.

## Adding new audit rules

- Add checks in `lib/audit.ts` and emit normalized findings (`severity`, `area`, `recommendation`, `howToApply`).
- Update scoring behavior in `lib/scoring.ts` if rule weighting strategy changes.

## Adding ad templates

- Register template metadata in `lib/ads.ts` (`adTemplates`).
- Extend script-generation prompt logic in `buildAdScript`.
- Swap placeholder renderer in `renderAdProject` with Remotion/FFmpeg pipeline when ready.

## Project routes

- `/` landing + scan input
- `/scan/[id]` dashboard
- `/connect` Shopify OAuth start
- `/ads` ad project list
- `/ads/new` ad creation
- `/settings` operational settings/help

## Tests

```bash
npm test
```

Covers:
- URL validation / SSRF guard
- sitemap parser behavior
- finding severity scoring

