import type { APIRoute, GetStaticPaths } from 'astro';
import { getCatalog } from '../../lib/catalog';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const { tools } = await getCatalog();
  return tools.map((tool) => ({
    params: { tool: tool.id },
  }));
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const wrapLines = (text: string, maxChars: number, maxLines: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
};

export const GET: APIRoute = async ({ params }) => {
  const { tools, categories } = await getCatalog();
  const tool = tools.find((entry) => entry.id === params.tool);
  if (!tool) return new Response('Not found', { status: 404 });

  const category = categories.find((entry) => entry.id === tool.category);
  const categoryName = category?.name ?? tool.category;
  const subLabel = tool.subcategory ? `${categoryName} · ${tool.subcategory.name}` : categoryName;
  const initials = tool.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const descLines = wrapLines(tool.description, 56, 3);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0e1a" />
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#121724" stroke="#232b40" stroke-width="2" />
  <rect x="96" y="96" width="88" height="88" rx="18" fill="#2459ee" />
  <text x="140" y="154" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700">${escapeXml(initials)}</text>
  <text x="212" y="136" fill="#7ea6ff" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600">${escapeXml(subLabel)}</text>
  <text x="212" y="172" fill="#a3adc2" font-family="system-ui, -apple-system, sans-serif" font-size="18">Awesome AI Tools · Open Catalog${tool.openSource === true ? ' · Open Source' : ''}</text>
  <text x="96" y="276" fill="#f2f5fb" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700">${escapeXml(tool.name.slice(0, 36))}</text>
  ${descLines
    .map(
      (line, idx) =>
        `<text x="96" y="${350 + idx * 44}" fill="#a3adc2" font-family="system-ui, -apple-system, sans-serif" font-size="28">${escapeXml(line)}</text>`,
    )
    .join('\n  ')}
  <text x="96" y="532" fill="#7ea6ff" font-family="ui-monospace, monospace" font-size="20">docs.aliammari.dev/en/tools/${escapeXml(tool.id)}/</text>
  <text x="1104" y="532" text-anchor="end" fill="#a3adc2" font-family="ui-monospace, monospace" font-size="18">CC0 1.0 Public Domain</text>
</svg>
`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
