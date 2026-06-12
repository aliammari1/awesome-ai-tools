# Banner & Social Preview — Image-Gen Prompt

This folder holds the brand assets for **Awesome AI Tools**. The images are **TODO**;
this file is the single art-direction prompt for generating them (paste into your
image model, or use the `brandkit` / `imagegen-frontend-web` skills).

The README references `assets/banner.png` (wide hero) and `assets/social-preview.png`
(the 1280×640 OpenGraph / GitHub social card). Generate both from the one prompt below,
just changing the aspect ratio.

## The prompt (copy-paste)

> A minimal, luxury brand banner for an open-source project called **"Awesome AI Tools"**.
> Dark AI-gradient aesthetic: a deep near-black background (#0B0D12) washing into a smooth
> electric gradient of indigo → violet → cyan (#6366F1 → #8B5CF6 → #22D3EE), evoking latent
> space / model embeddings. Thin, low-opacity neural-mesh and node-graph lines drift toward a
> soft focal cluster of glowing nodes. Crisp, premium, editorial composition with generous
> negative space. The wordmark **"Awesome AI Tools"** is set in a tight geometric sans
> (Inter / Geist) with wide letter-spacing, centered in the safe middle, plus a small tagline
> beneath: *"A hand-picked map of the AI tool landscape."* No clip-art robots, no stock
> "AI brain", no faces, no literal tools — abstract, restrained, high-end tech branding.
> Clean enough to read as a thumbnail. Vector-sharp, 4k, studio quality.

- **Wide hero** — render at ~**2400×800** → save as `assets/banner.png`.
- **Social card** — render at **1280×640** (keep wordmark + tagline within the center-safe
  area; GitHub/Twitter crop the edges) → save as `assets/social-preview.png`.
- Optional square **logo.svg** (favicon / docs avatar) from the focal-node cluster glyph.

## Rules

- Commit assets as **local PNG/SVG** in this folder so they never rate-limit or 404
  (do not hot-link external image hosts).
- Match the docs-site accent so README and `docs.aliammari.com` read as one brand.

## Wiring it up (once generated)

The README already has the hero block commented at the top — uncomment it:

```markdown
<p align="center">
  <img src="assets/banner.png" alt="Awesome AI Tools" width="100%">
</p>
```

Then set `assets/social-preview.png` under **Settings → Social preview** in the repo.
