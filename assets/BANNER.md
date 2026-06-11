# Banner & Social Preview Spec

This directory holds the brand assets for **Awesome AI Tools**. The images below
are **TODO** — this file is the art-direction brief for generating them (via the
`brandkit` skill for the identity board + `imagegen-frontend-web` for the wide hero).

## Direction

**Dark AI-gradient.** Deep near-black background (`#0B0D12`) washing into an electric
gradient — indigo → violet → cyan (`#6366F1 → #8B5CF6 → #22D3EE`) — evoking model
embeddings / latent space. Thin neural-mesh or node-graph lines, low opacity, drifting
toward a focal cluster. Crisp, premium, editorial; no clip-art robots, no stock "AI brain".
Typography: a tight geometric sans (e.g. Inter / Geist), generous letter-spacing on the
wordmark, plenty of negative space.

Tagline candidates (pick one): *"A hand-picked map of the AI tool landscape."* /
*"500+ AI tools, curated — not scraped."*

## Required assets

| File | Size | Purpose |
|---|---|---|
| `social-preview.png` | **1280×640** | GitHub repo **Settings → Social preview** (OpenGraph card) |
| `hero.png` (or `.svg`) | **~2400×800** (wide) | README hero at the top of the list |
| `logo.svg` | square, scalable | favicon / docs site / avatar; pairs with the Starlight docs `favicon.svg` |

Notes:
- Commit assets as **local PNG/SVG** in this folder so they never rate-limit or 404
  (do not hot-link external image hosts).
- The 1280×640 card should keep the wordmark + tagline within the safe center (Twitter/
  GitHub crop the edges).
- Match the docs site accent so the README and `docs.aliammari.com` feel like one brand.

## Usage (once generated)

Add near the top of `README.md`:

```markdown
<p align="center">
  <img src="assets/hero.png" alt="Awesome AI Tools" width="100%">
</p>
```

Then set `assets/social-preview.png` under **Settings → Social preview** in the repo.
