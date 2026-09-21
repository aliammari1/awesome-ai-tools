const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const editDistance = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const rows = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let j = 1; j <= b.length; j += 1) {
    let previous = rows[0];
    rows[0] = j;
    for (let i = 1; i <= a.length; i += 1) {
      const current = rows[i];
      rows[i] = Math.min(
        rows[i] + 1,
        rows[i - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return rows[a.length];
};

const queryScore = (card: HTMLElement, rawQuery: string) => {
  const query = normalize(rawQuery);
  if (!query) return 1;

  const name = normalize(card.dataset.name || '');
  const haystack = normalize(card.dataset.search || '');
  const words = haystack.split(' ').filter(Boolean);
  const tokens = query.split(' ').filter(Boolean);
  let total = 0;

  for (const token of tokens) {
    let score = 0;
    if (name === token) score = 100;
    else if (name.startsWith(token)) score = 70;
    else if (name.includes(token)) score = 50;
    else if (haystack.includes(token)) score = 24;
    else if (token.length >= 4 && words.some((word) => word.length >= 3 && editDistance(token, word) <= 1)) score = 10;

    if (!score) return 0;
    total += score;
  }

  if (name === query) total += 140;
  else if (name.startsWith(query)) total += 80;

  return total;
};

const valuesFor = (root: HTMLElement, name: string) =>
  [...root.querySelectorAll<HTMLInputElement>('input[name="' + name + '"]:checked')].map((input) => input.value);

export function initDirectory() {
  const root = document.querySelector<HTMLElement>('[data-directory]');
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const search = root.querySelector<HTMLInputElement>('#tool-search');
  const sort = root.querySelector<HTMLSelectElement>('#directory-sort');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-tool-card]')];
  const results = root.querySelector<HTMLElement>('#tool-results');
  const visibleCount = root.querySelector<HTMLElement>('#visible-count');
  const empty = root.querySelector<HTMLElement>('#empty-results');
  const activeFilters = root.querySelector<HTMLElement>('[data-active-filters]');
  const mobileFilterButton = root.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-view-button]')];
  const params = new URLSearchParams(window.location.search);

  const setChecked = (name: string, raw: string | null) => {
    if (!raw) return;
    const selected = new Set(raw.split(',').filter(Boolean));
    root.querySelectorAll<HTMLInputElement>('input[name="' + name + '"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });
  };

  if (search && params.get('q')) search.value = params.get('q') || '';
  setChecked('category', params.get('category'));
  setChecked('pricing', params.get('pricing'));
  const openSource = root.querySelector<HTMLInputElement>('input[name="openSource"]');
  if (openSource) openSource.checked = params.get('openSource') === 'true';
  if (sort && ['relevance', 'name', 'catalog'].includes(params.get('sort') || '')) {
    sort.value = params.get('sort') || 'relevance';
  }

  const storedView = (() => {
    try { return localStorage.getItem('awt:directory-view:v1'); } catch { return null; }
  })();
  const initialView = params.get('view') || storedView || 'grid';

  const setView = (view: string) => {
    const next = view === 'list' ? 'list' : 'grid';
    root.dataset.view = next;
    if (results) results.dataset.view = next;
    viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.viewButton === next)));
    try { localStorage.setItem('awt:directory-view:v1', next); } catch {}
  };
  setView(initialView);

  const labelFor = (input: HTMLInputElement) => {
    const label = input.closest('label');
    return label?.querySelector('span:nth-of-type(1)')?.textContent?.trim() || input.value;
  };

  const renderActiveFilters = () => {
    if (!activeFilters) return;
    activeFilters.replaceChildren();

    const query = search?.value.trim() || '';
    const checked = [...root.querySelectorAll<HTMLInputElement>('.filter-panel input:checked')];

    if (query) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'filter-chip';
      chip.dataset.removeQuery = 'true';
      chip.textContent = 'Search: “' + query + '” ×';
      activeFilters.append(chip);
    }

    checked.forEach((input) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'filter-chip';
      chip.dataset.removeFilterName = input.name;
      chip.dataset.removeFilterValue = input.value;
      chip.textContent = labelFor(input) + ' ×';
      activeFilters.append(chip);
    });

    if (query || checked.length) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'clear-filters';
      clear.dataset.clearFilters = 'true';
      clear.textContent = 'Clear all';
      activeFilters.append(clear);
    }

    if (mobileFilterButton) {
      const count = checked.length;
      mobileFilterButton.textContent = count ? 'Filters (' + count + ')' : 'Filters';
    }
  };

  const syncUrl = () => {
    const next = new URLSearchParams();
    const query = search?.value.trim() || '';
    const categories = valuesFor(root, 'category');
    const pricing = valuesFor(root, 'pricing');
    const view = root.dataset.view || 'grid';

    if (query) next.set('q', query);
    if (categories.length) next.set('category', categories.join(','));
    if (pricing.length) next.set('pricing', pricing.join(','));
    if (openSource?.checked) next.set('openSource', 'true');
    if (sort?.value && sort.value !== 'relevance') next.set('sort', sort.value);
    if (view === 'list') next.set('view', 'list');

    const suffix = next.toString();
    history.replaceState(null, '', location.pathname + (suffix ? '?' + suffix : '') + location.hash);
  };

  const apply = () => {
    const query = search?.value || '';
    const categories = new Set(valuesFor(root, 'category'));
    const pricing = new Set(valuesFor(root, 'pricing'));
    const onlyOpen = !!openSource?.checked;

    const ranked = cards.map((card) => {
      const score = queryScore(card, query);
      const matchesCategory = categories.size === 0 || categories.has(card.dataset.category || '');
      const matchesPricing = pricing.size === 0 || pricing.has(card.dataset.pricing || '');
      const matchesOpen = !onlyOpen || card.dataset.openSource === 'true';
      const visible = score > 0 && matchesCategory && matchesPricing && matchesOpen;
      card.hidden = !visible;
      return {
        card,
        score,
        order: Number(card.dataset.order || '0'),
        name: card.dataset.name || '',
        visible,
      };
    });

    const mode = sort?.value || 'relevance';
    ranked.sort((a, b) => {
      if (mode === 'name') return a.name.localeCompare(b.name);
      if (mode === 'catalog') return a.order - b.order;
      return b.score - a.score || a.order - b.order;
    });
    ranked.forEach(({ card }) => results?.append(card));

    const count = ranked.filter((entry) => entry.visible).length;
    if (visibleCount) visibleCount.textContent = String(count);
    if (empty) empty.hidden = count !== 0;

    renderActiveFilters();
    syncUrl();
  };

  const clearFilters = () => {
    if (search) search.value = '';
    root.querySelectorAll<HTMLInputElement>('.filter-panel input').forEach((input) => { input.checked = false; });
    if (sort) sort.value = 'relevance';
    apply();
  };

  search?.addEventListener('input', apply);
  sort?.addEventListener('change', apply);
  root.querySelectorAll<HTMLInputElement>('.filter-panel input').forEach((input) => input.addEventListener('change', apply));

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null;
    if (!target) return;

    if (target.dataset.clearFilters !== undefined) {
      clearFilters();
      return;
    }
    if (target.dataset.removeQuery !== undefined) {
      if (search) search.value = '';
      apply();
      return;
    }
    if (target.dataset.removeFilterName && target.dataset.removeFilterValue) {
      const input = root.querySelector<HTMLInputElement>(
        'input[name="' + target.dataset.removeFilterName + '"][value="' + CSS.escape(target.dataset.removeFilterValue) + '"]',
      );
      if (input) input.checked = false;
      apply();
      return;
    }
    if (target.dataset.viewButton) {
      setView(target.dataset.viewButton);
      syncUrl();
      return;
    }
    if (target.dataset.filterToggle !== undefined) {
      const open = root.dataset.filtersOpen !== 'true';
      root.dataset.filtersOpen = String(open);
      mobileFilterButton?.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      return;
    }
    if (target.dataset.filterClose !== undefined) {
      root.dataset.filtersOpen = 'false';
      mobileFilterButton?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.dataset.filtersOpen === 'true') {
      root.dataset.filtersOpen = 'false';
      mobileFilterButton?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      search?.focus();
      search?.select();
    }
    if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      event.preventDefault();
      search?.focus();
    }
  });

  apply();
}
