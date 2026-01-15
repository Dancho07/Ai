# AI Stock Trader Assistant

This project is a lightweight demo app that simulates an AI-style stock trading signal
engine. It produces a buy/sell/hold recommendation, suggested position sizing, and a
plain-language thesis based on a synthetic 30-day price series.

> **Disclaimer:** This is an educational demo and is **not** financial advice.

## Quick start (local)

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Publish to GitHub Pages

1. Commit and push this repository to GitHub.
2. In **Repository Settings → Pages**, set **Source** to **Deploy from a branch**.
3. Choose the branch you pushed (for example, **main** or **work**) and the
   **/ (root)** folder.
4. Save, then wait for GitHub to provide the public Pages URL.

Once enabled, GitHub Pages will serve `index.html` from the root of the repository.

### Troubleshooting

- If you see a 404, confirm the Pages URL (it should look like
  `https://<username>.github.io/<repo>/`).
- Make sure `index.html` is in the root of the repository and that the Pages source is
  set to the root folder.
- If you recently pushed changes, wait a minute or two and refresh the page.
