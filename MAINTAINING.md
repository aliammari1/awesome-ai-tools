# Maintaining Awesome AI Tools

This guide covers routine review and incident response. [CONTRIBUTING.md](CONTRIBUTING.md) is the shorter entry point for contributors.

## Review a catalog submission

1. Check the official destination and look for an existing entry, including a duplicate under another name or URL. Treat a link check as evidence of reachability only; it cannot establish that a product is safe or worthwhile.
2. Check that the description says what the tool does in plain language. Ask for a source for unusual capabilities, pricing, or open-source claims. Unknown metadata should stay `null`.
3. Confirm the category and subcategory help readers find the tool. A new category needs a clear reason; avoid creating one for a single entry.
4. Check the catalog JSON and generated `README.md` diff. The `source` field records how an entry was added; it is not a review or safety badge. Keep the diff focused.
5. Use the CI result for schema, generation, code checks, and build. Review dependency changes separately. Network link reports may need manual interpretation because sites can block automated requests.

The default contributor path is `bun ci`, creating or editing a tool record, `bun run generate:readme`, then `bun run check:pr`. The `check:pr` command runs catalog validation, verifies that `README.md` is in sync, and executes the test suite. CI runs the full check suite (catalog validation, tests, typechecking, format check, Awesome lint, and site build). CI reads PR code with read-only repository permissions. Do not give untrusted PR jobs deployment credentials or automatic write access to the repository.

## Keep the catalog trustworthy

Fix ordinary dead links or stale descriptions through public issues and pull requests. Mark a genuinely retired product `deprecated` or `discontinued` when preserving its record helps maintainers understand the catalog history. These records are excluded from public clickable listings. Remove a confirmed malicious, hijacked, or phishing destination from the catalog promptly. Follow [SECURITY.md](SECURITY.md) for confidential reports; do not copy sensitive report details into a public issue before remediation.

The scheduled link check is a maintenance signal. Review redirects and context before changing records, and avoid repeatedly contacting a site that rejects automated traffic. Keep private-address exclusions enabled for any job that visits contributor-supplied URLs.

## CI and dependency upkeep

Keep the Bun version in `package.json` aligned with CI, and install from the lockfile with `bun ci`. Review dependency updates for release notes, license changes, and relevant advisories. Run `bun run check` before merging changes to scripts, catalog validation, or the site. The workflow's aggregate result is named **CI gate**. Review branch protection and merge queue rules before changing them: require **CI gate**, and retire any old **PR gate** or **Merge gate** requirements only after confirming the new check runs and reports correctly. Merge queue checks need the same validation as pull requests if a queue is enabled.

Dependency vulnerabilities are audited via `bun run audit:dependencies`. As documented in [SECURITY.md](SECURITY.md), the lint-only advisory `GHSA-vfj7-8cjw-p6xm` (`braces@3.0.3` via `awesome-lint`) is ignored using an explicit, single-advisory flag. Do not use blanket `--ignore` flags. Re-evaluate this ignore when `awesome-lint` or its upstream dependencies are bumped.

Pinned GitHub Actions reduce surprise updates. Update pins deliberately and review the upstream action and release notes. A PR job should be able to validate without secrets. Keep publication or deployment credentials in a separate trusted path.

## Multilingual Architecture and SEO Strategy

The static directory supports 7 locales (`en`, `fr`, `ar`, `es`, `de`, `zh`, `ja`), building detail pages and category listings across each locale.

- **Canonical Content:** `en` (English) is the single canonical source of truth for all tool descriptions, categories, and catalog metadata.
- **Duplicate Content & Google Search Central Compliance:**
  - Legacy locale URLs currently render English fallback UI and content so existing links do not break. Per Google Search Central guidelines on duplicate content:
    1. Every non-English page emits `<meta name="robots" content="noindex, follow">` to prevent indexing of untranslated duplicates.
    2. Every non-English page sets `<link rel="canonical">` to the corresponding `/en/...` route.
    3. `sitemap.xml` strictly indexes only `/en/...` URLs, keeping search crawler budgets focused on canonical pages.
    4. `hreflang` tags are intentionally omitted until human or full localized content is published for each language.
- **Edge Routing:** Root `/` redirects to `/en/` via `public/_redirects` (HTTP 302 on Cloudflare Pages) with fallback client meta-refresh in `src/pages/index.astro`. In Cloudflare Pages, static files in `dist/` (`dist/index.html`) take precedence over `_redirects` rules, serving `index.html` with client-side dark-themed meta-refresh unless edge redirect rules or Cloudflare Bulk Redirects are configured to intercept `/`.

## Deployment

The repository contains a Cloudflare Pages project name and `dist` output directory in [`wrangler.toml`](wrangler.toml). It does not establish whether the live Pages project uses Git integration or direct upload. Before editing deployment automation or repository settings, verify in the Cloudflare dashboard:

- the connected repository and production branch, if Git integration is enabled;
- the build command, output directory, environment variables, and custom domain;
- preview deployment permissions and the last successful production deployment.

Record the verified deployment mode and rollback steps here when they are known. If Git integration is active, confirm that a merged change produces the expected production deployment. If direct upload is active, document the trusted workflow and credential scope before changing it. For a bad release, use the Pages deployment history to restore the last known good deployment, then fix the source and rerun CI. Do not point production at an unreviewed PR build.
