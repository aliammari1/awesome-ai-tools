import MiniSearch from 'minisearch';

export interface SearchDoc {
  id: string;
  name: string;
  text: string;
  category?: string;
  subcategory?: string;
  openSource?: string;
}

export interface ParsedSearchQuery {
  raw: string;
  textQuery: string;
  terms: string[];
  phrases: string[];
  excludes: string[];
  domains: string[];
  types: string[];
  oss: 'true' | 'false' | null;
  hasConstraints: boolean;
}

export const normalizeTerm = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Parse structured operators (`domain:`, `oss:yes`, `type:`, `-exclude`, `"exact phrase"`)
 * alongside free-text search terms.
 */
export function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const phrases: string[] = [];
  const excludes: string[] = [];
  const domains: string[] = [];
  const types: string[] = [];
  let oss: 'true' | 'false' | null = null;
  const freeTokens: string[] = [];

  let working = rawQuery.replace(/[“”]/g, '"');
  working = working.replace(/"([^"]+)"/g, (_match, phrase: string) => {
    const clean = normalizeTerm(phrase);
    if (clean) phrases.push(clean);
    return ' ';
  });

  for (const rawToken of working.split(/\s+/).filter(Boolean)) {
    const lower = normalizeTerm(rawToken);
    if (!lower) continue;

    if (lower.startsWith('domain:') || lower.startsWith('category:')) {
      const val = lower.slice(lower.indexOf(':') + 1).trim();
      if (val) domains.push(val);
    } else if (lower.startsWith('type:') || lower.startsWith('sub:')) {
      const val = lower.slice(lower.indexOf(':') + 1).trim();
      if (val) types.push(val);
    } else if (lower.startsWith('oss:')) {
      const val = lower.slice(4).trim();
      if (val === 'yes' || val === 'true' || val === '1') oss = 'true';
      else if (val === 'no' || val === 'false' || val === '0') oss = 'false';
    } else if (lower.startsWith('-') && lower.length > 1) {
      excludes.push(lower.slice(1));
    } else {
      freeTokens.push(lower);
    }
  }

  const textQuery = [...freeTokens, ...phrases].join(' ').trim();
  const terms = [...freeTokens, ...phrases.flatMap((p) => p.split(/\s+/).filter(Boolean))].filter(
    (t) => t.length >= 2,
  );

  const hasConstraints = Boolean(
    textQuery ||
    phrases.length ||
    excludes.length ||
    domains.length ||
    types.length ||
    oss !== null,
  );

  return {
    raw: rawQuery,
    textQuery,
    terms,
    phrases,
    excludes,
    domains,
    types,
    oss,
    hasConstraints,
  };
}

/**
 * Split text into plain and highlighted segments for safe DOM rendering without innerHTML.
 */
export function splitHighlightParts(
  text: string,
  terms: string[],
): Array<{ text: string; match: boolean }> {
  const cleanTerms = [...new Set(terms.map((t) => t.trim()).filter((t) => t.length >= 2))].sort(
    (a, b) => b.length - a.length,
  );
  if (!cleanTerms.length || !text) return [{ text, match: false }];

  const escaped = cleanTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts: Array<{ text: string; match: boolean }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      parts.push({ text: text.slice(lastIndex, idx), match: false });
    }
    parts.push({ text: match[0], match: true });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), match: false });
  }
  return parts.length ? parts : [{ text, match: false }];
}

/**
 * Explain concisely why a record matched an active query.
 */
export function explainMatch(doc: SearchDoc, parsed: ParsedSearchQuery): string {
  if (!parsed.hasConstraints) return '';
  const reasons: string[] = [];
  const normName = normalizeTerm(doc.name);
  const normText = normalizeTerm(doc.text);

  const nameHits = parsed.terms.filter((t) => normName.includes(t));
  if (nameHits.length > 0) {
    reasons.push('Matched name');
  }

  for (const phrase of parsed.phrases) {
    if (normText.includes(phrase)) {
      reasons.push(`Exact phrase “${phrase}”`);
    }
  }

  const descHits = parsed.terms.filter((t) => !normName.includes(t) && normText.includes(t));
  if (descHits.length > 0) {
    reasons.push(`Matched: ${descHits.slice(0, 3).join(', ')}`);
  }

  if (parsed.oss === 'true') reasons.push('Open source');
  if (parsed.domains.length) reasons.push(`Domain: ${parsed.domains.join(', ')}`);
  if (parsed.types.length) reasons.push(`Type: ${parsed.types.join(', ')}`);

  return reasons.join(' · ') || (parsed.textQuery ? 'Fuzzy match' : '');
}

/**
 * Ranked, typo-tolerant search over the directory records.
 *
 * Every query word must match (AND). Words match as prefixes so results appear
 * while typing, and longer words tolerate a one- or two-letter typo. Name
 * matches outrank description matches, and an exact or leading name match is
 * lifted above everything else.
 */
export function createDirectorySearch(docs: SearchDoc[]) {
  const index = new MiniSearch<SearchDoc>({
    fields: ['name', 'text'],
    idField: 'id',
    processTerm: (term) => normalizeTerm(term) || null,
    searchOptions: {
      boost: { name: 3 },
      prefix: true,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      combineWith: 'AND',
    },
  });
  index.addAll(docs);

  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  const names = new Map(docs.map((doc) => [doc.id, normalizeTerm(doc.name)]));
  const texts = new Map(docs.map((doc) => [doc.id, normalizeTerm(doc.text)]));

  const searchFn = (rawQuery: string): Map<string, number> => {
    const parsed = parseSearchQuery(rawQuery);
    const scores = new Map<string, number>();
    if (!parsed.hasConstraints) return scores;

    if (parsed.textQuery) {
      const query = normalizeTerm(parsed.textQuery).replace(/\s+/g, ' ');
      for (const hit of index.search(query)) {
        const name = names.get(hit.id) ?? '';
        const bonus = name === query ? 100 : name.startsWith(query) ? 25 : 0;
        scores.set(hit.id, hit.score + bonus);
      }
    } else {
      for (const doc of docs) {
        scores.set(doc.id, 1);
      }
    }

    for (const [id] of [...scores]) {
      const doc = byId.get(id);
      const text = texts.get(id) ?? '';
      if (!doc) {
        scores.delete(id);
        continue;
      }
      if (parsed.phrases.some((phrase) => !text.includes(phrase))) {
        scores.delete(id);
        continue;
      }
      if (parsed.excludes.some((ex) => text.includes(ex))) {
        scores.delete(id);
        continue;
      }
      if (
        parsed.domains.length > 0 &&
        !parsed.domains.some((d) => (doc.category ?? '').includes(d) || text.includes(d))
      ) {
        scores.delete(id);
        continue;
      }
      if (
        parsed.types.length > 0 &&
        !parsed.types.some((t) => (doc.subcategory ?? '').includes(t) || text.includes(t))
      ) {
        scores.delete(id);
        continue;
      }
      if (parsed.oss !== null && doc.openSource !== undefined && doc.openSource !== parsed.oss) {
        scores.delete(id);
        continue;
      }
    }

    return scores;
  };

  searchFn.suggest = (rawQuery: string, limit = 3): string[] => {
    const q = normalizeTerm(rawQuery);
    if (!q || q.length < 2) return [];
    const results = index.autoSuggest(q, { fuzzy: 0.35, prefix: true, combineWith: 'OR' });
    const suggestions = results.map((r) => r.suggestion).slice(0, limit);
    if (suggestions.length > 0) return suggestions;

    const fallback: Array<{ name: string; dist: number }> = [];
    for (const doc of docs) {
      const n = normalizeTerm(doc.name);
      if (n.slice(0, 2) === q.slice(0, 2) || n.includes(q.slice(0, 3))) {
        fallback.push({ name: doc.name, dist: Math.abs(n.length - q.length) });
      }
    }
    return fallback
      .sort((a, b) => a.dist - b.dist)
      .slice(0, limit)
      .map((f) => f.name);
  };

  searchFn.autocomplete = (rawQuery: string, limit = 6): string[] => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return [];
    const lastToken = trimmed.split(/\s+/).at(-1)?.toLowerCase() ?? '';
    if (lastToken.startsWith('oss:')) {
      return ['oss:yes', 'oss:no'];
    }
    if (lastToken.startsWith('domain:')) {
      const prefix = lastToken.slice(7);
      const cats = [...new Set(docs.map((d) => d.category).filter(Boolean))] as string[];
      return cats
        .filter((c) => c.includes(prefix))
        .slice(0, limit)
        .map((c) => `domain:${c}`);
    }
    if (lastToken.startsWith('type:')) {
      const prefix = lastToken.slice(5);
      const subs = [...new Set(docs.map((d) => d.subcategory).filter(Boolean))] as string[];
      return subs
        .filter((s) => s.includes(prefix))
        .slice(0, limit)
        .map((s) => `type:${s}`);
    }

    const q = normalizeTerm(trimmed);
    const nameMatches = docs.filter((d) => normalizeTerm(d.name).startsWith(q)).map((d) => d.name);
    const auto = index.autoSuggest(q, { prefix: true, fuzzy: 0.2 }).map((r) => r.suggestion);
    return [...new Set([...nameMatches, ...auto])].slice(0, limit);
  };

  return searchFn;
}
