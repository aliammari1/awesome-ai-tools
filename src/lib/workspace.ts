export const STORAGE_KEYS = {
  SAVED: 'awt:saved-tools:v1',
  COMPARE: 'awt:compare-tools:v1',
  THEME: 'awt:theme:v1',
  LOCALE: 'awt:locale:v1',
  LOCALE_DISMISSED: 'awt:locale-dismissed:v1',
  VIEW: 'awt:directory-view:v2',
  LISTS: 'awt:lists:v1',
  ACTIVE_LIST: 'awt:active-list:v1',
  NOTES: 'awt:tool-notes:v1',
  TAGS: 'awt:tool-tags:v1',
  STACK: 'awt:stack-tools:v1',
  HIDDEN: 'awt:hidden-tools:v1',
  RECENT_TOOLS: 'awt:recent-tools:v1',
  RECENT_SEARCHES: 'awt:recent-searches:v1',
  SAVED_SEARCHES: 'awt:saved-searches:v1',
  PREFS: 'awt:a11y-prefs:v1',
} as const;

export const MAX_COMPARE_TOOLS = 3;

export interface NamedList {
  id: string;
  name: string;
  ids: string[];
}

export interface SavedSearchPreset {
  id: string;
  name: string;
  query: string;
}

export interface ExportableTool {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  subcategory?: string | null;
  openSource?: boolean | null;
  note?: string;
  tags?: string[];
}

export const STORAGE_DESCRIPTIONS: Array<{ key: string; label: string; purpose: string }> = [
  {
    key: STORAGE_KEYS.SAVED,
    label: 'Default saved shortlist',
    purpose: 'Tool IDs bookmarked in your primary saved list.',
  },
  {
    key: STORAGE_KEYS.COMPARE,
    label: 'Comparison tray',
    purpose: 'Up to 3 tool IDs selected for side-by-side comparison.',
  },
  {
    key: STORAGE_KEYS.LISTS,
    label: 'Custom named lists',
    purpose: 'Additional named tool collections created in your workspace.',
  },
  {
    key: STORAGE_KEYS.NOTES,
    label: 'Private tool notes',
    purpose: 'Personal notes attached to saved tools (never leaves your browser).',
  },
  {
    key: STORAGE_KEYS.TAGS,
    label: 'Saved tool tags',
    purpose: 'Custom tags attached to saved tools for filtering.',
  },
  {
    key: STORAGE_KEYS.STACK,
    label: 'Personal stack (“I use this”)',
    purpose: 'Tools marked as part of your active daily stack.',
  },
  {
    key: STORAGE_KEYS.HIDDEN,
    label: 'Hidden tools',
    purpose: 'Tools muted from directory search results.',
  },
  {
    key: STORAGE_KEYS.RECENT_TOOLS,
    label: 'Recently viewed tools',
    purpose: 'Last 12 tool detail pages visited in this browser.',
  },
  {
    key: STORAGE_KEYS.RECENT_SEARCHES,
    label: 'Recent search queries',
    purpose: 'Recent directory search strings for quick recall.',
  },
  {
    key: STORAGE_KEYS.SAVED_SEARCHES,
    label: 'Saved search presets',
    purpose: 'Named filter and query combinations saved in the directory.',
  },
  {
    key: STORAGE_KEYS.VIEW,
    label: 'Directory density & layout',
    purpose: 'Preferred result layout (comfortable list, compact list, or grid).',
  },
  {
    key: STORAGE_KEYS.THEME,
    label: 'Color theme preference',
    purpose: 'Selected light or dark appearance.',
  },
  {
    key: STORAGE_KEYS.PREFS,
    label: 'Accessibility preferences',
    purpose: 'Text size and reduced-motion overrides.',
  },
  {
    key: STORAGE_KEYS.LOCALE,
    label: 'Preferred interface language',
    purpose: 'Remembered locale code from the language switcher.',
  },
];

export function exportListMarkdown(listName: string, tools: ExportableTool[]): string {
  const lines = [`# ${listName}`, ''];
  for (const tool of tools) {
    lines.push(`- **[${tool.name}](${tool.url})** (${tool.category}) — ${tool.description}`);
    if (tool.tags && tool.tags.length > 0) {
      lines.push(`  - Tags: ${tool.tags.map((t) => `\`${t}\``).join(', ')}`);
    }
    if (tool.note && tool.note.trim()) {
      lines.push(`  - Note: ${tool.note.trim()}`);
    }
  }
  return lines.join('\n') + '\n';
}

const escapeCsvCell = (value: string) => {
  if (/[",\r\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
  return value;
};

export function exportListCsv(tools: ExportableTool[]): string {
  const header = ['id', 'name', 'url', 'category', 'description', 'tags', 'note'];
  const rows = tools.map((tool) =>
    [
      tool.id,
      tool.name,
      tool.url,
      tool.category,
      tool.description,
      (tool.tags ?? []).join(';'),
      tool.note ?? '',
    ]
      .map(escapeCsvCell)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n') + '\n';
}

export function exportListJson(
  listName: string,
  tools: ExportableTool[],
  notes: Record<string, string> = {},
  tags: Record<string, string[]> = {},
): string {
  return (
    JSON.stringify(
      {
        version: 1,
        name: listName,
        exportedAt: new Date().toISOString().slice(0, 10),
        ids: tools.map((t) => t.id),
        notes: Object.fromEntries(tools.filter((t) => notes[t.id]).map((t) => [t.id, notes[t.id]])),
        tags: Object.fromEntries(
          tools.filter((t) => tags[t.id]?.length).map((t) => [t.id, tags[t.id]]),
        ),
      },
      null,
      2,
    ) + '\n'
  );
}

export function parseImportedListJson(
  raw: string,
  validIds?: Set<string>,
): {
  name: string;
  ids: string[];
  notes: Record<string, string>;
  tags: Record<string, string[]>;
} | null {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const ids = parsed
        .filter((item): item is string => typeof item === 'string')
        .filter((id) => !validIds || validIds.has(id));
      return { name: 'Imported list', ids: [...new Set(ids)], notes: {}, tags: {} };
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const rawIds = Array.isArray(parsed.ids)
        ? parsed.ids
        : Array.isArray(parsed.tools)
          ? parsed.tools.map((t: unknown) =>
              typeof t === 'string'
                ? t
                : typeof t === 'object' && t !== null && 'id' in t
                  ? (t as { id: string }).id
                  : '',
            )
          : [];
      const ids = rawIds
        .filter((item: unknown): item is string => typeof item === 'string' && item.length > 0)
        .filter((id: string) => !validIds || validIds.has(id));
      const name =
        typeof parsed.name === 'string' && parsed.name.trim()
          ? parsed.name.trim().slice(0, 60)
          : 'Imported list';
      const notes: Record<string, string> = {};
      if (typeof parsed.notes === 'object' && parsed.notes !== null) {
        for (const [k, v] of Object.entries(parsed.notes)) {
          if (typeof v === 'string' && (!validIds || validIds.has(k))) notes[k] = v;
        }
      }
      const tags: Record<string, string[]> = {};
      if (typeof parsed.tags === 'object' && parsed.tags !== null) {
        for (const [k, v] of Object.entries(parsed.tags)) {
          if (Array.isArray(v) && (!validIds || validIds.has(k))) {
            tags[k] = v.filter((t): t is string => typeof t === 'string');
          }
        }
      }
      return { name, ids: [...new Set(ids)] as string[], notes, tags };
    }
    return null;
  } catch {
    return null;
  }
}

export function rowHasDifferences(values: string[]): boolean {
  if (values.length <= 1) return false;
  const first = values[0];
  return values.some((val) => val !== first);
}

export function formatCompareMarkdown(
  tools: Array<{ name: string; url: string }>,
  rows: Array<{ label: string; values: string[] }>,
): string {
  if (tools.length === 0) return '';
  const headers = ['Attribute', ...tools.map((t) => `[${t.name}](${t.url})`)];
  const divider = headers.map(() => '---');
  const body = rows.map((row) => [
    `**${row.label}**`,
    ...row.values.map((v) => v.replace(/\|/g, '\\|')),
  ]);
  return (
    [
      `| ${headers.join(' | ')} |`,
      `| ${divider.join(' | ')} |`,
      ...body.map((r) => `| ${r.join(' | ')} |`),
    ].join('\n') + '\n'
  );
}
