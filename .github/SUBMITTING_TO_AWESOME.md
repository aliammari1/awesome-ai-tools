# Submitting to the official `sindresorhus/awesome` index

Getting listed on the canonical [`sindresorhus/awesome`](https://github.com/sindresorhus/awesome)
index is the single biggest discoverability multiplier for this list. This is a maintainer
checklist + a ready-to-paste submission, kept in the repo so the bar is met *before* opening
the PR (Sindre auto-closes PRs that fail any item).

## Pre-flight checklist (must all pass)

Per <https://github.com/sindresorhus/awesome/blob/main/pull_request_template.md> and
<https://github.com/sindresorhus/awesome/blob/main/contributing.md>:

- [ ] The list has been **public for at least 30 days** with a few hundred quality entries.
- [ ] `npx awesome-lint` passes locally and in CI (we run it on every PR — see `ci.yml`).
- [ ] README starts with `# Awesome AI Tools` and the `awesome.re` badge on the title line. ✅
- [ ] There is a `## Contents` table of contents (after the intro, before the first section). ✅
- [ ] License is **CC0** with a committed `LICENSE` file. ✅
- [ ] `contributing.md` / `CONTRIBUTING.md` exists with submission guidelines. ✅
- [ ] `CODE_OF_CONDUCT.md` exists. ✅
- [ ] Entries are `- [Name](link) - Description.` — capitalized, ending with a period,
      and **not** longer than is necessary. ✅ (enforced by awesome-lint + PR template)
- [ ] Repo has a meaningful **description** and the topics `awesome` and `awesome-ai-tools`
      set in **About**.
- [ ] Social preview image set (Settings → Social preview) — see `assets/BANNER.md`.
- [ ] No broken links (we run `lychee` on PRs and weekly — see `links-weekly.yml`).
- [ ] The list is **not** a duplicate of an existing entry on the awesome index in the same niche
      (search the index for "AI" first; if a close one exists, justify the distinct angle —
      curated + quality-gated + multilingual docs site).

## How to submit

1. Fork [`sindresorhus/awesome`](https://github.com/sindresorhus/awesome).
2. Add **one line** to `readme.md` under the most fitting top-level section (e.g. *Programming*
   → near other AI/ML lists, or *Miscellaneous*), alphabetically ordered:

   ```markdown
   - [AI Tools](https://github.com/aliammari1/awesome-ai-tools#readme) - Hand-picked, quality-gated AI tools across productivity, code, design, writing, audio, video, and research, with a multilingual docs site.
   ```

3. Open the PR using their template. **Title:** `Add Awesome AI Tools`.
4. Tick every box in their PR template honestly (it mirrors the checklist above).

## Draft PR body (paste into the awesome PR)

> **Add Awesome AI Tools**
>
> A hand-picked, quality-gated list of 500+ AI tools across productivity, creativity,
> writing, data science, NLP, computer vision, audio/music, video, code generation, LLMs,
> business, and more.
>
> What makes it distinct from a generic "AI" entry: every tool is reviewed for being
> actively maintained, reachable, and non-duplicate (not auto-scraped); PRs are gated by
> `awesome-lint` + a `lychee` link check + an advisory AI categorize/dedupe/archive pass;
> and the list is published as a 7-language documentation site (Astro + Starlight) at
> docs.aliammari.com.
>
> - [x] awesome-lint passes
> - [x] CC0 license, CONTRIBUTING.md, CODE_OF_CONDUCT.md present
> - [x] >30 days old, hundreds of entries, actively maintained
> - [x] Social preview + topics set

## Adjacent aggregators worth a PR too

- `awesome.re` listing (follows from being on the official index).
- Niche AI awesome-list round-ups (search GitHub for `awesome-ai` collections).
- Non-English communities — the multilingual docs site (`docs.aliammari.com`) is the hook
  for milestone posts in Français / العربية / Español / Deutsch / 中文 / 日本語 channels.
