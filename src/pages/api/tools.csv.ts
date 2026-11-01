import type { APIRoute } from 'astro';
import { getCatalog, toolDate } from '../../lib/catalog';

export const prerender = true;

const escapeCsv = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

export const GET: APIRoute = async () => {
  const { tools, categories } = await getCatalog();
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const headers = [
    'id',
    'name',
    'url',
    'description',
    'category',
    'category_name',
    'subcategory_id',
    'subcategory_name',
    'pricing',
    'open_source',
    'status',
    'source_kind',
    'source_date',
  ];

  const rows = tools.map((tool) =>
    [
      tool.id,
      tool.name,
      tool.url,
      tool.description,
      tool.category,
      categoryNames[tool.category] ?? tool.category,
      tool.subcategory?.id ?? '',
      tool.subcategory?.name ?? '',
      tool.pricing ?? '',
      tool.openSource === null ? '' : String(tool.openSource),
      tool.status,
      tool.source.kind,
      toolDate(tool),
    ]
      .map(escapeCsv)
      .join(','),
  );

  const csv = [headers.join(','), ...rows].join('\n') + '\n';

  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  });
};
