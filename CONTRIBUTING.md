# Contributing

Thanks for helping maintain **Awesome AI Tools**. The project is a curated catalog, so quality and verifiable information matter more than raw entry count.

## Source of truth

Tool records live in `catalog/tools/`. Category records live in `catalog/categories/`.

**Do not add or edit tool entries directly in `README.md`.** The README and website are both generated from the structured catalog.

## Add a tool

1. Choose the most specific existing category and subcategory.
2. Add a JSON file at `catalog/tools/<slug>.json`.
3. Keep the description factual and concise. Explain what the tool does; avoid marketing claims, rankings, valuations, user counts, and other volatile facts unless they are separately sourced.
4. Use `null` instead of guessing unknown metadata such as pricing or open-source status.
5. Run:

   ```sh
   bun install
   bun run validate
   bun run generate:readme
   bun run build
   ```

6. Open a pull request. CI validates the catalog, confirms the README is generated, runs `awesome-lint`, checks links, and builds the Astro site.

Example:

```json
{
  "name": "Example Tool",
  "url": "https://example.com/",
  "description": "One factual sentence describing what the tool does.",
  "category": "code-generation-and-development",
  "subcategory": {
    "id": "ai-coding-assistants",
    "name": "AI Coding Assistants"
  },
  "order": 9999,
  "openSource": null,
  "pricing": null,
  "status": "listed",
  "source": {
    "kind": "new-submission"
  }
}
```

The required `source` field records provenance for both new submissions and migrated entries. Use `{"kind": "new-submission"}` for a new tool, as in the example above; do not invent a migration date.

Keep `readme-migration` and the recorded `migratedAt` value only for entries actually imported by the README migration, for example:

```json
{
  "source": {
    "kind": "readme-migration",
    "migratedAt": "2026-09-21"
  }
}
```

Neither source kind is proof of independent verification of pricing, availability, or product claims. A migration date is not a verification date.

## Quality bar

A tool should be:

- **Real and reachable** — a working, publicly accessible product or repository.
- **Actively maintained** — abandoned or archived projects should be marked or removed.
- **Distinct** — avoid near-duplicate entries that do not add meaningful value.
- **Legitimate** — no scams, deceptive wrappers, or affiliate traps.
- **Clearly described** — descriptions should state function, not repeat vendor slogans.

## Update or remove a tool

Edit the JSON record when a URL, description, category, or status changes. For discontinued tools, prefer a clear `discontinued` status when preserving the URL is useful to people following old links.

## Translations

The former automatic production translation pipeline has been retired. Legacy locale URLs currently use English fallback content and are not indexed as translated pages. Reviewed translations can be reintroduced later without duplicating the entire catalog.

## License

By contributing, you agree that your contribution is released under [CC0 1.0 Universal](LICENSE), as is the rest of the catalog.
