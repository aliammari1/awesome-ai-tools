import { pricingLabels } from '../lib/pricing';
import { formatCompareMarkdown, rowHasDifferences } from '../lib/workspace';

type CompareTool = {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  subcategory: string | null;
  pricing: 'free' | 'freemium' | 'paid' | 'contact-sales' | null;
  openSource: boolean | null;
};

const KEY = 'awt:compare-tools:v1';

const readStored = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === 'string').slice(0, 3)
      : [];
  } catch {
    return [];
  }
};

const writeStored = (ids: string[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 3)));
  } catch {
    /* localStorage can be unavailable in private or locked-down contexts */
  }
};

const td = (value: string) => {
  const cell = document.createElement('td');
  cell.textContent = value;
  return cell;
};

export function initComparePage() {
  const dataNode = document.querySelector<HTMLScriptElement>('#compare-data');
  if (!dataNode) return;

  const allTools = JSON.parse(dataNode.textContent || '[]') as CompareTool[];
  const byId = new Map(allTools.map((tool) => [tool.id, tool]));
  const params = new URLSearchParams(location.search);
  const fromUrl = (params.get('ids') || '')
    .split(',')
    .filter((id) => byId.has(id))
    .slice(0, 3);

  let currentIds: string[] = fromUrl.length
    ? fromUrl
    : readStored()
        .filter((id) => byId.has(id))
        .slice(0, 3);

  if (fromUrl.length) writeStored(fromUrl);

  const render = () => {
    const ids = currentIds.filter((id) => byId.has(id)).slice(0, 3);
    const tools = ids.map((id) => byId.get(id)).filter(Boolean) as CompareTool[];

    const empty = document.querySelector<HTMLElement>('#compare-empty');
    const content = document.querySelector<HTMLElement>('#compare-content');
    const grid = document.querySelector<HTMLElement>('#compare-grid');
    const head = document.querySelector<HTMLElement>('#compare-head');
    const body = document.querySelector<HTMLElement>('#compare-body');

    if (!empty || !content || !grid || !head || !body) return;

    empty.hidden = tools.length > 0;
    content.hidden = tools.length === 0;
    grid.replaceChildren();
    head.replaceChildren();
    body.replaceChildren();

    if (!tools.length) {
      history.replaceState(null, '', location.pathname);
      return;
    }

    tools.forEach((tool) => {
      const card = document.createElement('article');
      card.className = 'tool';

      const mark = document.createElement('div');
      mark.className = 'tool-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = tool.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('');

      const body = document.createElement('div');
      body.className = 'tool-body';
      const heading = document.createElement('h3');
      heading.className = 'tool-name';
      heading.textContent = tool.name;
      const description = document.createElement('p');
      description.className = 'tool-desc';
      description.textContent = tool.description;
      const meta = document.createElement('div');
      meta.className = 'tool-meta';
      meta.textContent = tool.subcategory || tool.category;
      body.append(heading, description, meta);

      const actions = document.createElement('div');
      actions.className = 'tool-actions';

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'action';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + tool.name + ' from comparison');
      remove.addEventListener('click', () => {
        currentIds = currentIds.filter((id) => id !== tool.id);
        writeStored(currentIds);
        document.dispatchEvent(new CustomEvent('awt:compare-changed'));
        render();
      });

      const visit = document.createElement('a');
      visit.className = 'action action-visit';
      visit.href = tool.url;
      visit.target = '_blank';
      visit.rel = 'noopener noreferrer nofollow';
      visit.textContent = 'Visit ↗';
      visit.setAttribute('aria-label', 'Visit ' + tool.name + ' (opens in a new tab)');

      actions.append(remove, visit);
      card.append(mark, body, actions);
      grid.append(card);
    });

    const headerRow = document.createElement('tr');
    const blank = document.createElement('th');
    blank.scope = 'col';
    blank.textContent = 'Attribute';
    headerRow.append(blank);
    tools.forEach((tool) => {
      const header = document.createElement('th');
      header.scope = 'col';
      header.textContent = tool.name;
      headerRow.append(header);
    });
    head.append(headerRow);

    const rows: Array<[string, (tool: CompareTool) => string]> = [
      ['Category', (tool) => tool.category],
      ['Subcategory', (tool) => tool.subcategory || 'Not recorded'],
      ['Pricing', (tool) => (tool.pricing ? pricingLabels[tool.pricing] : 'Not recorded')],
      [
        'Open source',
        (tool) =>
          tool.openSource === true ? 'Yes' : tool.openSource === false ? 'No' : 'Not recorded',
      ],
      ['Verification', () => 'Not independently verified'],
    ];

    const markdownRows: Array<{ label: string; values: string[] }> = [];
    rows.forEach(([label, value]) => {
      const values = tools.map((tool) => value(tool));
      markdownRows.push({ label, values });
      const row = document.createElement('tr');
      if (rowHasDifferences(values)) row.className = 'compare-diff';
      const header = document.createElement('th');
      header.scope = 'row';
      header.textContent = label;
      row.append(header);
      values.forEach((cell) => row.append(td(cell)));
      body.append(row);
    });

    const copy = document.querySelector<HTMLButtonElement>('#compare-copy');
    if (copy) {
      copy.onclick = async () => {
        const markdown = formatCompareMarkdown(tools, markdownRows);
        try {
          await navigator.clipboard.writeText(markdown);
          copy.textContent = 'Copied';
        } catch {
          copy.textContent = 'Copy failed';
        }
      };
    }

    const next = new URLSearchParams();
    next.set('ids', ids.join(','));
    history.replaceState(null, '', location.pathname + '?' + next.toString());
  };

  document.addEventListener('awt:compare-changed', () => {
    const stored = readStored()
      .filter((id) => byId.has(id))
      .slice(0, 3);
    try {
      if (localStorage.getItem(KEY) !== null || stored.length > 0) {
        currentIds = stored;
      }
    } catch {
      /* localStorage blocked, preserve in-memory currentIds */
    }
    render();
  });
  render();
}
