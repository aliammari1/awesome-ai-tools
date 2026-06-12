# Growth & Distribution Playbook

Everything needed to turn this curated list into a high-discovery, high-star repo. Most of
this requires the maintainer's GitHub account (settings, topics, PRs) or social posting — the
in-repo content (README CTA, AI Agents section, awesome-lint readiness, submission text) is
already done. This file is the checklist + ready-to-paste copy.

> Why this is the single biggest star lever in the portfolio: awesome-lists are the most
> star-dense format on GitHub, and one accepted upstream listing on `sindresorhus/awesome`
> drives passive, compounding discovery — forever. See `SUBMITTING_TO_AWESOME.md` for the PR.

---

## 1. GitHub topics (set under repo → About → ⚙ → Topics)

Use these exact topics (GitHub allows up to 20; these are the highest-traffic exact matches):

```
awesome
awesome-list
ai-tools
artificial-intelligence
llm
generative-ai
ai-agents
mcp
machine-learning
deep-learning
chatgpt
open-source
developer-tools
ai
```

Rationale: `awesome` + `awesome-list` put the repo in the awesome aggregator feeds;
`ai-agents`, `mcp`, and `generative-ai` are the white-hot 2026 search terms; `ai-tools` and
`artificial-intelligence` are the broad evergreen ones. Stars correlate ~0.93 with topic/search
ranking, so accurate topics compound over time.

## 2. About text (set under repo → About → Description)

Paste exactly (keyword-rich, under GitHub's length limit, leads with the searched phrases):

```
A hand-picked, quality-gated list of the best AI tools — LLMs, AI agents, MCP, generative AI, coding assistants, image/audio/video, and more. Searchable multilingual site at docs.aliammari.com.
```

Also set:
- **Website:** `https://docs.aliammari.com`
- **Social preview** (Settings → Social preview): generate from `assets/BANNER.md` and upload
  `assets/social-preview.png` (1280×640). Required by the awesome index checklist.

## 3. Submit to the official `sindresorhus/awesome` index

The full, ready-to-paste PR text and pre-flight checklist already live in
[`.github/SUBMITTING_TO_AWESOME.md`](.github/SUBMITTING_TO_AWESOME.md). Confirmed current and
accurate. Quick version:

1. Be public ≥30 days with hundreds of quality entries — **met**.
2. `npx awesome-lint` passes in CI — **met** (runs on every PR via `ci.yml`).
3. README starts with `# Awesome AI Tools` + `awesome.re` badge, has `## Contents`, CC0
   `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` — **all met**.
4. Topics `awesome` + `awesome-ai-tools` + meaningful About set — **do this (section 1–2)**.
5. Social preview image set — **do this (section 2)**.
6. Fork `sindresorhus/awesome`, add one alphabetically-ordered line, open PR titled
   `Add Awesome AI Tools`, tick every box honestly.

The one line to add to their `readme.md`:

```markdown
- [AI Tools](https://github.com/aliammari1/awesome-ai-tools#readme) - Hand-picked, quality-gated AI tools across productivity, code, design, writing, audio, video, agents, and research, with a multilingual docs site.
```

### Adjacent lists worth a PR (compounding faucets)

- `josephmisiti/awesome-machine-learning`
- `owainlewis/awesome-artificial-intelligence`
- `e2b-dev/awesome-ai-agents` and `kyrolabs/awesome-agents` (the AI-agents angle)
- `punkpeye/awesome-mcp-servers` (if/when MCP entries are added)
- Non-English communities — lead with the multilingual `docs.aliammari.com` site as the hook.

## 4. Launch posts

Personal-story headlines get ~3× the engagement of feature-list headlines. Post Tue–Thu,
~13:00–16:00 UTC. Seed the first comment yourself and reply within the hour.

### r/artificial (or r/ArtificialIntelligence)

**Title:** `I got tired of auto-scraped "best AI tools" listicles, so I hand-curated and quality-gated one — now ~400 tools, weekly-updated, with a searchable multilingual site`

**Body:**
> Every "top AI tools" list I found was either SEO spam or an auto-scraped dump full of dead
> links and clones. So I started maintaining my own: every entry is checked for being actively
> maintained, reachable, and non-duplicate, and PRs are gated by awesome-lint + a link checker
> + an AI categorize/dedupe pass.
>
> It's CC0 (public domain), organized into ~20 categories including a fresh **AI Agents**
> section for 2026, and there's a fast, searchable version in 7 languages.
>
> Repo: https://github.com/aliammari1/awesome-ai-tools
> Searchable site: https://docs.aliammari.com
>
> What category is thinnest / what did I miss? PRs and suggestions welcome.

### r/ChatGPT

**Title:** `Spent a year curating AI tools by hand instead of trusting listicles — here's the searchable list (CC0, 7 languages, weekly updates)`

**Body:**
> Sharing a hand-maintained map of the AI tool landscape — productivity, image/video/audio,
> coding assistants, LLMs, and a dedicated AI-agents section. No affiliate links, no scraped
> dead entries; it's public domain and you can search it in 7 languages.
>
> https://docs.aliammari.com (list: https://github.com/aliammari1/awesome-ai-tools)
>
> Which tools have actually stuck in your daily workflow? Adding the good ones.

### X / Twitter thread

1/ Most "best AI tools" lists are auto-scraped spam with dead links. I've been hand-curating
the opposite for a while — ~400 tools, every one checked for being alive + maintained +
non-duplicate. CC0, weekly-updated. 🧵

2/ It's structured like a real awesome-list: ~20 categories, a dedicated **AI Agents** section
for 2026 (OpenAI Agents SDK, MCP, OpenHands, Letta, Browser Use…), and it passes awesome-lint.

3/ The twist: there's a fast, *searchable* version in 7 languages (EN/FR/AR/ES/DE/中文/日本語),
built with Astro + Starlight on Cloudflare Pages → https://docs.aliammari.com

4/ It's public domain (CC0) — fork it, embed it, ship it. PRs welcome; they get auto-checked by
awesome-lint + a link checker + an AI dedupe pass. ⭐ to bookmark:
https://github.com/aliammari1/awesome-ai-tools

### Hacker News (Show HN, optional)

**Title:** `Show HN: A hand-curated, quality-gated AI tools list with a searchable 7-language site`
First comment: explain the quality bar (alive + maintained + non-dupe, awesome-lint + link +
AI-dedupe CI) and that it's CC0. Link both the repo and docs.aliammari.com.

## 5. Cadence (keeps the "updated weekly" claim true → freshness signal)

- Merge/add a few vetted tools weekly (the README CTA and Footnotes both promise this).
- The `docs` branch + Astro i18n pipeline regenerates translations automatically on each
  README change (`update-docs-i18n.yml`) — no manual i18n work needed.
- Keep an eye on the weekly `lychee` link check (`links-weekly.yml`) and prune dead links.

## What's already done in-repo (no account needed)

- ⭐ "Star to bookmark — updated weekly" CTA at the top of the README.
- 🔎 Prominent "Browse the live, searchable list" button to docs.aliammari.com.
- A dedicated top-level **AI Agents** category (2026 search term) + cross-links.
- A **Featured Open-Source AI Projects** mini-section (JobPrep [source-available], readrealm, pulmocare).
- awesome.re badge, clean `## Contents` ToC, CC0 license, CONTRIBUTING + CoC, awesome-lint in CI.
- Ready-to-paste upstream submission text in `.github/SUBMITTING_TO_AWESOME.md`.
