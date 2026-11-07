import {
  STORAGE_KEYS,
  exportListCsv,
  exportListJson,
  exportListMarkdown,
  parseImportedListJson,
  type ExportableTool,
  type NamedList,
} from '../lib/workspace';

const SAVED = STORAGE_KEYS.SAVED;
const LISTS = STORAGE_KEYS.LISTS;
const ACTIVE = STORAGE_KEYS.ACTIVE_LIST;
const NOTES = STORAGE_KEYS.NOTES;
const TAGS = STORAGE_KEYS.TAGS;
const DEFAULT_ID = 'saved';

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const readIds = (key: string) => {
  const parsed = readJson<unknown>(key, []);
  return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const readLists = (): NamedList[] => {
  const parsed = readJson<unknown>(LISTS, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (entry): entry is NamedList =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as NamedList).id === 'string' &&
      typeof (entry as NamedList).name === 'string' &&
      Array.isArray((entry as NamedList).ids),
  );
};

const toast = (message: string) => {
  const region = document.querySelector<HTMLElement>('[data-toast-region]');
  if (!region) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  region.replaceChildren(node);
  window.setTimeout(() => node.remove(), 2800);
};

const download = (filename: string, contents: string, type: string) => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export function initSavedPage() {
  const picker = document.querySelector<HTMLSelectElement>('#saved-list-picker');
  const countEl = document.querySelector<HTMLElement>('#saved-count');
  const listEl = document.querySelector<HTMLElement>('#saved-list');
  const emptyEl = document.querySelector<HTMLElement>('#no-saved-tools');
  if (!picker || !countEl || !listEl || !emptyEl) return;

  const sharedIds = new URLSearchParams(location.search)
    .get('ids')
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const notes = () => readJson<Record<string, string>>(NOTES, {});
  const tags = () => readJson<Record<string, string[]>>(TAGS, {});

  const listsWithDefault = (): NamedList[] => [
    { id: DEFAULT_ID, name: 'Saved', ids: readIds(SAVED) },
    ...readLists(),
  ];

  const activeId = () => {
    if (sharedIds && sharedIds.length > 0 && !picker.value) return 'shared';
    return picker.value || localStorage.getItem(ACTIVE) || DEFAULT_ID;
  };

  const idsFor = (id: string) => {
    if (id === 'shared') return sharedIds ?? [];
    if (id === DEFAULT_ID) return readIds(SAVED);
    return readLists().find((list) => list.id === id)?.ids ?? [];
  };

  const writeIds = (id: string, ids: string[]) => {
    const unique = [...new Set(ids)];
    if (id === DEFAULT_ID) {
      writeJson(SAVED, unique);
      return;
    }
    const next = readLists().map((list) => (list.id === id ? { ...list, ids: unique } : list));
    writeJson(LISTS, next);
  };

  const fillPicker = () => {
    const current = picker.value || localStorage.getItem(ACTIVE) || DEFAULT_ID;
    picker.replaceChildren();
    if (sharedIds && sharedIds.length > 0) {
      const shared = document.createElement('option');
      shared.value = 'shared';
      shared.textContent = 'Shared link';
      picker.append(shared);
    }
    for (const list of listsWithDefault()) {
      const option = document.createElement('option');
      option.value = list.id;
      option.textContent = list.name;
      picker.append(option);
    }
    const wanted = sharedIds?.length && !localStorage.getItem(ACTIVE) ? 'shared' : current;
    if ([...picker.options].some((option) => option.value === wanted)) picker.value = wanted;
  };

  const render = () => {
    fillPicker();
    const id = activeId();
    const selected = new Set(idsFor(id));
    const noteMap = notes();
    const tagMap = tags();
    let count = 0;
    document.querySelectorAll<HTMLElement>('[data-saved-wrapper]').forEach((wrapper) => {
      const toolId = wrapper.dataset.savedWrapper || '';
      const show = selected.has(toolId);
      wrapper.hidden = !show;
      if (!show) return;
      count += 1;
      let extra = wrapper.querySelector<HTMLElement>('.saved-extra');
      if (!extra) {
        extra = document.createElement('div');
        extra.className = 'saved-extra';
        const tagLabel = document.createElement('label');
        tagLabel.textContent = 'Tags';
        const tagInput = document.createElement('input');
        tagInput.type = 'text';
        tagInput.placeholder = 'comma-separated';
        tagInput.dataset.toolTags = toolId;
        tagLabel.append(tagInput);
        const noteLabel = document.createElement('label');
        noteLabel.textContent = 'Private note';
        const noteInput = document.createElement('textarea');
        noteInput.rows = 2;
        noteInput.dataset.toolNote = toolId;
        noteLabel.append(noteInput);
        const use = document.createElement('button');
        use.type = 'button';
        use.className = 'btn btn-secondary btn-sm';
        use.dataset.useTool = toolId;
        use.setAttribute('aria-pressed', 'false');
        const useLabel = document.createElement('span');
        useLabel.dataset.pressedLabel = 'In my stack';
        useLabel.textContent = 'I use this';
        use.append(useLabel);
        extra.append(tagLabel, noteLabel, use);
        wrapper.append(extra);
      }
      const note = wrapper.querySelector<HTMLTextAreaElement>('[data-tool-note]');
      const tag = wrapper.querySelector<HTMLInputElement>('[data-tool-tags]');
      if (note && document.activeElement !== note) note.value = noteMap[toolId] || '';
      if (tag && document.activeElement !== tag) tag.value = (tagMap[toolId] || []).join(', ');
    });
    countEl.textContent = String(count);
    listEl.hidden = count === 0;
    emptyEl.hidden = count > 0;
    try {
      if (id !== 'shared') localStorage.setItem(ACTIVE, id);
    } catch {
      /* preference is optional */
    }
  };

  const toolsInView = (): ExportableTool[] => {
    const id = activeId();
    const noteMap = notes();
    const tagMap = tags();
    const collected: ExportableTool[] = [];
    for (const toolId of idsFor(id)) {
      const wrapper = document.querySelector<HTMLElement>(
        `[data-saved-wrapper="${CSS.escape(toolId)}"]`,
      );
      if (!wrapper) continue;
      const visit = wrapper.querySelector<HTMLAnchorElement>('.action-visit');
      collected.push({
        id: toolId,
        name: wrapper.querySelector('.tool-name')?.textContent?.trim() || toolId,
        url: visit?.href || '',
        description: wrapper.querySelector('.tool-desc')?.textContent?.trim() || '',
        category: wrapper.querySelector('.tool-meta span')?.textContent?.trim() || '',
        note: noteMap[toolId],
        tags: tagMap[toolId],
      });
    }
    return collected;
  };

  picker.addEventListener('change', render);

  document.querySelector('[data-new-list]')?.addEventListener('click', () => {
    const name = window.prompt('Name this list');
    if (!name?.trim()) return;
    const id = 'list-' + Date.now().toString(36);
    writeJson(LISTS, [...readLists(), { id, name: name.trim().slice(0, 60), ids: [] }]);
    picker.value = id;
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-export-list]').forEach((button) => {
    button.addEventListener('click', () => {
      const tools = toolsInView();
      const name = picker.selectedOptions[0]?.textContent || 'List';
      const kind = button.dataset.exportList;
      if (kind === 'csv') download('list.csv', exportListCsv(tools), 'text/csv');
      else if (kind === 'json')
        download('list.json', exportListJson(name, tools, notes(), tags()), 'application/json');
      else download('list.md', exportListMarkdown(name, tools), 'text/markdown');
    });
  });

  document
    .querySelector<HTMLInputElement>('#saved-import')
    ?.addEventListener('change', async (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
      const valid = new Set(
        [...document.querySelectorAll<HTMLElement>('[data-saved-wrapper]')].map(
          (node) => node.dataset.savedWrapper || '',
        ),
      );
      const parsed = parseImportedListJson(await input.files[0].text(), valid);
      input.value = '';
      if (!parsed || parsed.ids.length === 0) {
        toast('That file did not contain catalog tool ids.');
        return;
      }
      const id = 'list-' + Date.now().toString(36);
      writeJson(LISTS, [...readLists(), { id, name: parsed.name, ids: parsed.ids }]);
      const noteMap = notes();
      const tagMap = tags();
      writeJson(NOTES, { ...noteMap, ...parsed.notes });
      writeJson(TAGS, { ...tagMap, ...parsed.tags });
      picker.value = id;
      render();
      toast('Imported ' + parsed.ids.length + ' tools into “' + parsed.name + '”.');
    });

  document.querySelector('[data-share-list]')?.addEventListener('click', async () => {
    const ids = idsFor(activeId());
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('ids', ids.join(','));
    try {
      await navigator.clipboard.writeText(url.toString());
      toast('Share link copied. It only contains tool ids.');
    } catch {
      toast(url.toString());
    }
  });

  document.querySelector('[data-print-list]')?.addEventListener('click', () => window.print());

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target instanceof HTMLTextAreaElement && target.dataset.toolNote) {
      const next = notes();
      const value = target.value.trim();
      if (value) next[target.dataset.toolNote] = target.value;
      else delete next[target.dataset.toolNote];
      writeJson(NOTES, next);
    }
    if (target instanceof HTMLInputElement && target.dataset.toolTags) {
      const next = tags();
      const values = target.value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (values.length) next[target.dataset.toolTags] = values;
      else delete next[target.dataset.toolTags];
      writeJson(TAGS, next);
    }
  });

  document.addEventListener('click', (event) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('[data-remove-from-list]')
        : null;
    if (!button) return;
    const toolId = button.dataset.removeFromList;
    const listId = activeId();
    if (!toolId || listId === 'shared') return;
    const previous = idsFor(listId);
    writeIds(
      listId,
      previous.filter((id) => id !== toolId),
    );
    render();
    toast('Removed from this list.');
  });

  document.addEventListener('awt:saved-changed', () => {
    if (activeId() === DEFAULT_ID) render();
  });
  document.addEventListener('awt:workspace-changed', render);

  if (sharedIds && sharedIds.length > 0) {
    const keep = document.createElement('button');
    keep.type = 'button';
    keep.className = 'btn btn-secondary btn-sm';
    keep.textContent = 'Save shared link as a list';
    keep.addEventListener('click', () => {
      const id = 'list-' + Date.now().toString(36);
      writeJson(LISTS, [...readLists(), { id, name: 'Shared list', ids: sharedIds }]);
      picker.value = id;
      history.replaceState(null, '', location.pathname);
      render();
    });
    document.querySelector('.saved-toolbar')?.append(keep);
  }

  render();
}
