# Reporting a Bad or Unsafe Tool

This repository publishes a structured catalog of links to third-party AI tools and a
static Astro directory built from that catalog. The application itself does not proxy
or execute the listed products. The main catalog-specific security risk is a listed
link becoming unsafe — for example, a domain takeover, malware redirect, phishing page,
or a formerly legitimate project being compromised.

If you spot an entry like that, please help us remove it quickly.

## How to report

Email **contact@aliammari.dev** with `[awesome-ai-tools]` in the subject and include:

- the tool name and catalog URL,
- what is wrong (dead domain, redirect to malware, phishing, hijacked project, etc.),
- and evidence that helps verify the report.

Please report suspicious links by email rather than opening a public issue when early
disclosure could expose other visitors. Maintainers remove confirmed unsafe destinations
from the catalog. A `discontinued` status is for product lifecycle history, not a
substitute for removing a malicious or hijacked link. Ordinary dead links may be
reported in a public issue.

## Website vulnerabilities

If you find a vulnerability in the Astro site, CI/deployment configuration, or another
piece of repository-owned code, use the same private email channel and include clear
reproduction steps. Do not include credentials, tokens, or unrelated personal data.

## A note for users

Every catalog entry links to a product run by someone else. Inclusion is not an
endorsement or a security guarantee. Review a product's own privacy, security, and terms
before giving it sensitive data.

## Dependency Security & Advisory Assessment

We perform automated vulnerability audits on all dependencies via `bun audit --audit-level=high`.

### GHSA-vfj7-8cjw-p6xm (braces@3.0.3)

- **Dependency chain:** `awesome-lint@2.3.0` → `globby@14.1.0` → `fast-glob@3.3.3` → `micromatch@4.0.8` → `braces@3.0.3`
- **Vulnerability type:** Regular expression / uncontrolled resource consumption in braces expansion when parsing untrusted, deeply nested pattern inputs.
- **Exposure assessment:** Negligible / Zero in runtime. `awesome-lint` is strictly a build-time and CI development linter for the Markdown list. It only evaluates repository files against hardcoded, trusted internal file patterns (`readme.md`, `contributing.md`, etc.). Contributor submissions (JSON data and text fields) are never evaluated as glob patterns. Furthermore, neither `awesome-lint` nor `braces` is bundled into the client-side JavaScript or static HTML deployed to Cloudflare Pages.
- **Current status:** An advisory-specific suppression flag (`--ignore=GHSA-vfj7-8cjw-p6xm`) is used in `bun run audit:dependencies` pending an upstream release from `micromatch` or `awesome-lint`. The suppression will be removed immediately once a patched dependency tree is published upstream.
