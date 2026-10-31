# Contributing to Awesome AI Tools

Thank you for helping curate and maintain **Awesome AI Tools**! We strive to maintain a high-signal catalog of genuinely useful AI developer tools, frameworks, and resources.

---

## How to Contribute

Choose the path that fits best:

### Option A: Suggest a Tool via Issue (No Setup Required)

If you don't want to install dependencies or open a pull request:

1. Open a [Tool Addition Request](https://github.com/aliammari1/awesome-ai-tools/issues/new?template=tool_addition.yml).
2. Provide the tool name, canonical URL, a one-sentence factual description, and the category.
3. A maintainer will review the link and add it to the catalog.

### Option B: Submit a Pull Request

The catalog source of truth is structured JSON records in `catalog/tools/*.json`. `README.md` is generated automatically from these records.

1. **Install dependencies:**

   ```sh
   bun ci
   ```

2. **Add the tool:**
   - **Using the CLI wizard (recommended):**

     ```sh
     bun run new:tool
     ```

     This interactive helper validates inputs, checks for duplicate URLs and names, creates the JSON file, and updates `README.md`.

   - **Or manually create `catalog/tools/<slug>.json`:**
     ```json
     {
       "name": "Tool Name",
       "url": "https://example.com/",
       "description": "One factual sentence ending with a period.",
       "category": "code-generation-and-development",
       "subcategory": null,
       "order": 9999,
       "openSource": null,
       "pricing": null,
       "status": "listed",
       "source": {
         "kind": "community",
         "addedAt": "YYYY-MM-DD"
       }
     }
     ```
     Then regenerate the README:
     ```sh
     bun run generate:readme
     ```

3. **Verify locally:**

   ```sh
   bun run check:pr
   ```

   This fast check validates the schema, verifies `README.md` is in sync, and runs the test suite.

4. **Submit your PR:**
   Commit your new `catalog/tools/<slug>.json` and the updated `README.md`.

---

## Curation Standards

This list is curated for quality and utility, not exhaustive web scraping.

### What Belongs

- **Publicly accessible:** Fully usable without private waitlists or closed beta invites.
- **Actively maintained:** Shows ongoing maintenance, documentation, and clear updates.
- **Substantive utility:** Solves a real problem in AI development, research, automation, or creative workflow.
- **Factual clarity:** Clear, verifiable capabilities without deceptive marketing.

### What Does Not Belong

- **Waitlists & vaporware:** Unreleased landing pages collecting emails.
- **Thin wrappers:** Trivial API wrappers adding no distinct feature, UI, or performance value.
- **Affiliate referral links:** Links with referral parameters or marketing attribution tokens.
- **Duplicate listings:** The same project under multiple domains or sub-brands.
- **Dead / abandoned projects:** Repositories without maintenance or defunct services.

---

## URL & Content Rules

- **HTTPS required:** Every URL must use secure `https://`.
- **No tracking / affiliate tokens:** Parameters like `utm_*`, `ref`, `aff`, `gclid`, and `fbclid` are strictly rejected by the validator.
- **Documentation anchors permitted:** Legitimate section anchors (e.g. `#quickstart`, `#installation`, `#readme`) and functional query parameters (e.g. `?tab=docs`) are permitted.
- **Neutral descriptions:** State plainly what the tool does. Do not use hyperbolic marketing terms ("the world's best", "revolutionary", "#1").
- **Unknown metadata:** Leave `openSource`, `pricing`, or `subcategory` as `null` unless verified from primary sources.

---

## Useful Commands

| Command                   | Purpose                                                          |
| :------------------------ | :--------------------------------------------------------------- |
| `bun ci`                  | Install dependencies from lockfile                               |
| `bun run new:tool`        | Interactive wizard to scaffold and add a tool                    |
| `bun run generate:readme` | Regenerate `README.md` from catalog records                      |
| `bun run check:pr`        | Fast check (schema, README sync, tests)                          |
| `bun run check`           | Full pre-merge check (types, formatting, linter, build, budgets) |
| `bun run format`          | Auto-format files with Prettier                                  |
| `bun run dev`             | Run local Astro web directory preview (`localhost:4321`)         |

---

## Security & Link Reports

- **Dead or broken links:** Open a [Broken Link Report](https://github.com/aliammari1/awesome-ai-tools/issues/new?template=broken_link.yml).
- **Compromised or malicious domains:** Do not open a public issue. Follow [SECURITY.md](SECURITY.md) to notify maintainers privately.

---

## License

By contributing, you agree that your contribution is dedicated to the public domain under [CC0 1.0 Universal](LICENSE).
