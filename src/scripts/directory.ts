import { DIRECTORY_BATCH_SIZE, visibleResultCount } from '../lib/directory-pagination';
import {
  createDirectorySearch,
  explainMatch,
  parseSearchQuery,
  splitHighlightParts,
  type SearchDoc,
} from '../lib/directory-search';
import { STORAGE_KEYS, type SavedSearchPreset } from '../lib/workspace';
import { showToast } from './site';

const VIEW_KEY = STORAGE_KEYS.VIEW;
const RECENT_SEARCHES_KEY = STORAGE_KEYS.RECENT_SEARCHES;
const SAVED_SEARCHES_KEY = STORAGE_KEYS.SAVED_SEARCHES;
const HIDDEN_KEY = STORAGE_KEYS.HIDDEN;
const FACETS = ['category', 'subcategory', 'pricing'] as const;

const valuesFor = (root: HTMLElement, name: string) =>
  [...root.querySelectorAll<HTMLInputElement>('input[name="' + name + '"]:checked')].map(
    (input) => input.value,
  );

const prefersReducedMotion = () =>
  document.documentElement.dataset.motion === 'reduce' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const closeIcon = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-close');
  svg.append(use);
  return svg;
};

const readStringList = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

const writeStringList = (key: string, list: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* best effort */
  }
};

const readSavedSearches = (): SavedSearchPreset[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSavedSearches = (presets: SavedSearchPreset[]) => {
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(presets));
  } catch {
    /* best effort */
  }
};

const renderHighlightedText = (el: HTMLElement, rawText: string, terms: string[]) => {
  const parts = splitHighlightParts(rawText, terms);
  if (parts.length === 1 && !parts[0].match) {
    if (el.textContent !== rawText || el.querySelector('mark')) {
      el.textContent = rawText;
    }
    return;
  }
  el.replaceChildren();
  for (const part of parts) {
    if (part.match) {
      const mark = document.createElement('mark');
      mark.className = 'search-mark';
      mark.textContent = part.text;
      el.append(mark);
    } else {
      el.append(document.createTextNode(part.text));
    }
  }
};

export function initDirectory() {
  const root = document.querySelector<HTMLElement>('[data-directory]');
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const search = root.querySelector<HTMLInputElement>('#tool-search');
  const autocompleteBox = root.querySelector<HTMLElement>('[data-search-autocomplete]');
  const recentSearchesRow = root.querySelector<HTMLElement>('[data-recent-searches]');
  const savedSearchesRow = root.querySelector<HTMLElement>('[data-saved-searches]');
  const sort = root.querySelector<HTMLSelectElement>('#directory-sort');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-tool-card]')];
  const results = root.querySelector<HTMLElement>('#tool-results');
  const visibleCount = root.querySelector<HTMLElement>('#visible-count');
  const matchCount = root.querySelector<HTMLElement>('#match-count');
  const sheetCount = root.querySelector<HTMLElement>('[data-filter-result-count]');
  const empty = root.querySelector<HTMLElement>('#empty-results');
  const didYouMean = root.querySelector<HTMLElement>('[data-did-you-mean]');
  const pagination = root.querySelector<HTMLElement>('[data-directory-pagination]');
  const loadMoreButton = root.querySelector<HTMLButtonElement>('[data-load-more]');
  const infiniteScrollToggle = root.querySelector<HTMLInputElement>('[data-infinite-scroll]');
  const shareStatus = root.querySelector<HTMLElement>('[data-share-status]');
  const shareFallback = root.querySelector<HTMLInputElement>('[data-share-fallback]');
  const activeFilters = root.querySelector<HTMLElement>('[data-active-filters]');
  const filterToggle = root.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const filterToggleLabel = root.querySelector<HTMLElement>('[data-filter-toggle-label]');
  const filterPanel = root.querySelector<HTMLElement>('#filters-panel');
  const facetSearch = root.querySelector<HTMLInputElement>('[data-facet-search]');
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-view-button]')];
  const presetButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-preset-filter]')];
  const azButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-az-bar] [data-letter]')];
  const openSource = root.querySelector<HTMLInputElement>('input[name="openSource"]');
  const showHiddenInput = root.querySelector<HTMLInputElement>('[data-show-hidden]');

  const docs: SearchDoc[] = cards.map((card) => {
    const titleEl = card.querySelector<HTMLElement>('[data-tool-title]');
    const descEl = card.querySelector<HTMLElement>('[data-tool-desc]');
    const origName = titleEl?.textContent?.trim() || '';
    const origDesc = descEl?.textContent?.trim() || '';
    if (titleEl) titleEl.dataset.origText = origName;
    if (descEl) descEl.dataset.origText = origDesc;
    return {
      id: card.dataset.toolId || '',
      name: origName,
      text: [
        card.querySelector('.tool-name')?.textContent,
        card.querySelector('.tool-desc')?.textContent,
        card.querySelector('.tool-meta')?.textContent,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      category: card.dataset.category || '',
      subcategory: card.dataset.subcategory || '',
      openSource: card.dataset.openSource || '',
    };
  });
  const docById = new Map(docs.map((d) => [d.id, d]));
  const searchTools = createDirectorySearch(docs);

  // Reference timestamp from the newest catalog entry so "last N days" works deterministically
  let maxAddedMs = 0;
  for (const card of cards) {
    const t = Date.parse((card.dataset.added || '2026-09-21') + 'T00:00:00Z');
    if (t > maxAddedMs) maxAddedMs = t;
  }

  let batches = 1;
  let renderedOrder = '';
  let activeLetter = '';
  let kbFocusIndex = -1;

  const readStateFromUrl = (searchStr: string) => {
    const params = new URLSearchParams(searchStr);
    if (search) search.value = params.get('q') || '';
    root
      .querySelectorAll<HTMLInputElement>('.filter-panel input[type="checkbox"]')
      .forEach((input) => {
        if (!input.disabled) input.checked = false;
      });
    FACETS.forEach((name) => {
      const raw = params.get(name);
      if (!raw) return;
      const selected = new Set(raw.split(',').filter(Boolean));
      root.querySelectorAll<HTMLInputElement>('input[name="' + name + '"]').forEach((input) => {
        input.checked = selected.has(input.value);
      });
    });
    if (openSource) openSource.checked = params.get('openSource') === 'true';
    const recencyVal = params.get('recency') || '';
    root.querySelectorAll<HTMLInputElement>('input[name="recency"]').forEach((radio) => {
      radio.checked = radio.value === recencyVal;
    });
    activeLetter = (params.get('letter') || '').toLowerCase();
    azButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String((btn.dataset.letter || '') === activeLetter));
    });
    if (sort && ['relevance', 'name', 'newest', 'catalog'].includes(params.get('sort') || '')) {
      sort.value = params.get('sort') || 'relevance';
    } else if (sort) {
      sort.value = 'relevance';
    }
  };

  readStateFromUrl(window.location.search);

  const storedView = (() => {
    try {
      return localStorage.getItem(VIEW_KEY);
    } catch {
      return null;
    }
  })();

  const setView = (view: string) => {
    const next = view === 'grid' ? 'grid' : view === 'compact' ? 'compact' : 'list';
    root.dataset.view = next;
    if (results) results.dataset.view = next;
    viewButtons.forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.viewButton === next)),
    );
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* view preference is best-effort; storage may be unavailable */
    }
  };
  const initParams = new URLSearchParams(window.location.search);
  setView(initParams.get('view') || storedView || 'list');

  const labelFor = (input: HTMLInputElement) =>
    input.closest('label')?.querySelector('span')?.textContent?.trim() || input.value;

  const recordRecentSearch = (q: string) => {
    const clean = q.trim();
    if (clean.length < 2) return;
    const recent = readStringList(RECENT_SEARCHES_KEY).filter(
      (item) => item.toLowerCase() !== clean.toLowerCase(),
    );
    recent.unshift(clean);
    writeStringList(RECENT_SEARCHES_KEY, recent.slice(0, 6));
    renderRecentSearches();
  };

  const renderRecentSearches = () => {
    if (!recentSearchesRow) return;
    const list = readStringList(RECENT_SEARCHES_KEY);
    recentSearchesRow.replaceChildren();
    if (!list.length) {
      recentSearchesRow.hidden = true;
      return;
    }
    recentSearchesRow.hidden = false;
    const label = document.createElement('span');
    label.className = 'assist-label';
    label.textContent = 'Recent:';
    recentSearchesRow.append(label);

    list.forEach((term) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip chip-sm';
      btn.dataset.applyRecentSearch = term;
      btn.textContent = term;
      recentSearchesRow.append(btn);
    });

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'clear-link';
    clear.dataset.clearRecentSearches = 'true';
    clear.textContent = 'Clear';
    recentSearchesRow.append(clear);
  };

  const renderSavedSearches = () => {
    if (!savedSearchesRow) return;
    const presets = readSavedSearches();
    savedSearchesRow.replaceChildren();
    if (!presets.length) {
      savedSearchesRow.hidden = true;
      return;
    }
    savedSearchesRow.hidden = false;
    const label = document.createElement('span');
    label.className = 'assist-label';
    label.textContent = 'Saved searches:';
    savedSearchesRow.append(label);

    presets.forEach((preset) => {
      const wrap = document.createElement('span');
      wrap.className = 'saved-search-chip';
      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'chip chip-sm';
      applyBtn.dataset.applySavedSearch = preset.query;
      applyBtn.textContent = preset.name;

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'chip-del';
      delBtn.dataset.deleteSavedSearch = preset.id;
      delBtn.setAttribute('aria-label', 'Delete saved search ' + preset.name);
      delBtn.append(closeIcon());

      wrap.append(applyBtn, delBtn);
      savedSearchesRow.append(wrap);
    });
  };

  const syncPresets = () => {
    if (!presetButtons.length) return;
    const categories = valuesFor(root, 'category');
    const pricing = valuesFor(root, 'pricing');
    const subcategories = valuesFor(root, 'subcategory');
    const isOss = !!openSource?.checked;
    const hasQuery = Boolean(search?.value.trim());
    const noFacets =
      !categories.length && !pricing.length && !subcategories.length && !activeLetter;

    presetButtons.forEach((button) => {
      const kind = button.dataset.presetFilter;
      const category = button.dataset.presetCategory || '';
      let active = false;
      if (kind === 'all') active = !hasQuery && noFacets && !isOss;
      else if (kind === 'open-source') active = isOss && noFacets;
      else if (kind === 'free')
        active = pricing.length === 1 && pricing[0] === 'free' && !categories.length && !isOss;
      else if (kind === 'category' && category)
        active =
          categories.length === 1 &&
          categories[0] === category &&
          !pricing.length &&
          !subcategories.length &&
          !isOss;
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const makeChip = (text: string) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip chip-remove';
    chip.append(text, closeIcon());
    return chip;
  };

  const renderActiveFilters = () => {
    if (!activeFilters) return;
    activeFilters.replaceChildren();

    const query = search?.value.trim() || '';
    const checked = [
      ...root.querySelectorAll<HTMLInputElement>(
        '.filter-panel input[type="checkbox"]:checked:not(:disabled)',
      ),
    ].filter((el) => el.name !== 'showHidden');
    const recencyRadio = root.querySelector<HTMLInputElement>('input[name="recency"]:checked');
    const recencyVal = recencyRadio?.value || '';

    if (query) {
      const chip = makeChip('Search: “' + query + '”');
      chip.dataset.removeQuery = 'true';
      chip.setAttribute('aria-label', 'Remove search “' + query + '”');
      activeFilters.append(chip);
    }

    if (activeLetter) {
      const chip = makeChip('Starts with: ' + activeLetter.toUpperCase());
      chip.dataset.removeLetter = 'true';
      chip.setAttribute('aria-label', 'Remove letter filter');
      activeFilters.append(chip);
    }

    if (recencyVal) {
      const chip = makeChip('Last ' + recencyVal + ' days');
      chip.dataset.removeRecency = 'true';
      chip.setAttribute('aria-label', 'Remove date filter');
      activeFilters.append(chip);
    }

    checked.forEach((input) => {
      const label = labelFor(input);
      const chip = makeChip(label);
      chip.dataset.removeFilterName = input.name;
      chip.dataset.removeFilterValue = input.value;
      chip.setAttribute('aria-label', 'Remove filter ' + label);
      activeFilters.append(chip);
    });

    const totalFilters = checked.length + (activeLetter ? 1 : 0) + (recencyVal ? 1 : 0);

    if (query || totalFilters > 0) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'clear-link';
      clear.dataset.clearFilters = 'true';
      clear.textContent = 'Clear all';
      activeFilters.append(clear);
    }

    if (filterToggleLabel) {
      filterToggleLabel.textContent = totalFilters ? 'Filters (' + totalFilters + ')' : 'Filters';
    }

    syncPresets();
  };

  const getUrlSearchParams = () => {
    const next = new URLSearchParams();
    const query = search?.value.trim() || '';
    if (query) next.set('q', query);
    FACETS.forEach((name) => {
      const values = valuesFor(root, name);
      if (values.length) next.set(name, values.join(','));
    });
    if (openSource?.checked) next.set('openSource', 'true');
    const recencyVal =
      root.querySelector<HTMLInputElement>('input[name="recency"]:checked')?.value || '';
    if (recencyVal) next.set('recency', recencyVal);
    if (activeLetter) next.set('letter', activeLetter);
    if (sort?.value && sort.value !== 'relevance') next.set('sort', sort.value);
    if (root.dataset.view && root.dataset.view !== 'list') next.set('view', root.dataset.view);
    return next;
  };

  const syncUrl = () => {
    const suffix = getUrlSearchParams().toString();
    history.replaceState(
      null,
      '',
      location.pathname + (suffix ? '?' + suffix : '') + location.hash,
    );
  };

  const updateLiveFacetCounts = (
    queryScores: Map<string, number> | null,
    hiddenIds: Set<string>,
    showHidden: boolean,
  ) => {
    const catCounts = new Map<string, number>();
    const subCounts = new Map<string, number>();
    const priceCounts = new Map<string, number>();
    let ossCount = 0;

    for (const card of cards) {
      const id = card.dataset.toolId || '';
      if (!showHidden && hiddenIds.has(id)) continue;
      if (queryScores && (queryScores.get(id) ?? 0) <= 0) continue;
      const c = card.dataset.category || '';
      const s = card.dataset.subcategory || '';
      const p = card.dataset.pricing || '';
      if (c) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
      if (s) subCounts.set(s, (subCounts.get(s) ?? 0) + 1);
      if (p) priceCounts.set(p, (priceCounts.get(p) ?? 0) + 1);
      if (card.dataset.openSource === 'true') ossCount += 1;
    }

    root.querySelectorAll<HTMLElement>('[data-facet-count]').forEach((el) => {
      const spec = el.dataset.facetCount || '';
      const [kind, val] = spec.split(':');
      if (kind === 'category') el.textContent = String(catCounts.get(val) ?? 0);
      else if (kind === 'subcategory') el.textContent = String(subCounts.get(val) ?? 0);
      else if (kind === 'pricing') el.textContent = String(priceCounts.get(val) ?? 0);
      else if (kind === 'openSource') el.textContent = String(ossCount);
    });
  };

  const apply = (resetBatch = true, updateHistory = true) => {
    if (resetBatch) {
      batches = 1;
      kbFocusIndex = -1;
      if (shareStatus) shareStatus.textContent = '';
      if (shareFallback) shareFallback.hidden = true;
    }
    const query = search?.value.trim() || '';
    const parsedQuery = parseSearchQuery(query);
    const scores = parsedQuery.hasConstraints ? searchTools(query) : null;
    const selected = Object.fromEntries(
      FACETS.map((name) => [name, new Set(valuesFor(root, name))]),
    ) as Record<(typeof FACETS)[number], Set<string>>;
    const onlyOpen = !!openSource?.checked;
    const showHidden = !!showHiddenInput?.checked;
    const hiddenIds = new Set(readStringList(HIDDEN_KEY));
    const recencyDays = Number(
      root.querySelector<HTMLInputElement>('input[name="recency"]:checked')?.value || '0',
    );
    const minAddedMs = recencyDays > 0 ? maxAddedMs - recencyDays * 86_400_000 : 0;

    updateLiveFacetCounts(scores, hiddenIds, showHidden);

    const ranked = cards.map((card) => {
      const id = card.dataset.toolId || '';
      const score = scores ? (scores.get(id) ?? 0) : 1;
      const name = (card.querySelector('.tool-name')?.textContent || '').trim().toLowerCase();
      const added = card.dataset.added || '2026-09-21';
      const addedMs = Date.parse(added + 'T00:00:00Z');
      const isHidden = hiddenIds.has(id);

      const visible =
        score > 0 &&
        (showHidden || !isHidden) &&
        (!activeLetter || name.startsWith(activeLetter)) &&
        (minAddedMs === 0 || addedMs >= minAddedMs) &&
        (selected.category.size === 0 || selected.category.has(card.dataset.category || '')) &&
        (selected.subcategory.size === 0 ||
          selected.subcategory.has(card.dataset.subcategory || '')) &&
        (selected.pricing.size === 0 || selected.pricing.has(card.dataset.pricing || '')) &&
        (!onlyOpen || card.dataset.openSource === 'true');
      return {
        id,
        card,
        score,
        order: Number(card.dataset.order || '0'),
        added,
        name,
        visible,
      };
    });

    const mode = sort?.value || 'relevance';
    ranked.sort((a, b) => {
      if (mode === 'name') return a.name.localeCompare(b.name);
      if (mode === 'newest') return b.added.localeCompare(a.added) || a.order - b.order;
      if (mode === 'catalog') return a.order - b.order;
      return b.score - a.score || a.order - b.order;
    });

    const orderKey = ranked.map((entry) => entry.id).join('|');
    if (orderKey !== renderedOrder) {
      renderedOrder = orderKey;
      ranked.forEach(({ card }) => results?.append(card));
    }

    const count = ranked.filter((entry) => entry.visible).length;
    const displayed = visibleResultCount(count, batches);
    let shown = 0;

    ranked.forEach(({ id, card, visible }) => {
      card.classList.remove('is-kb-focused');
      if (visible && shown < displayed) {
        card.hidden = false;
        shown += 1;

        // Highlight matched terms and render "Why this matched" snippet
        const titleEl = card.querySelector<HTMLElement>('[data-tool-title]');
        const descEl = card.querySelector<HTMLElement>('[data-tool-desc]');
        let whyEl = card.querySelector<HTMLElement>('[data-why-matched]');
        if (titleEl && titleEl.dataset.origText) {
          renderHighlightedText(titleEl, titleEl.dataset.origText, parsedQuery.terms);
        }
        if (descEl && descEl.dataset.origText) {
          renderHighlightedText(descEl, descEl.dataset.origText, parsedQuery.terms);
        }
        const doc = docById.get(id);
        const reason = doc && parsedQuery.hasConstraints ? explainMatch(doc, parsedQuery) : '';
        if (reason) {
          if (!whyEl) {
            whyEl = document.createElement('p');
            whyEl.className = 'tool-why';
            whyEl.dataset.whyMatched = '';
            card.querySelector('.tool-body')?.append(whyEl);
          }
          whyEl.textContent = reason;
          whyEl.hidden = false;
        } else if (whyEl) {
          whyEl.hidden = true;
        }
      } else {
        card.hidden = true;
      }
    });

    if (visibleCount) visibleCount.textContent = String(displayed);
    if (matchCount) matchCount.textContent = String(count);
    if (sheetCount) sheetCount.textContent = String(count);
    if (empty) empty.hidden = count !== 0;

    // "Did you mean" suggestions on empty results
    if (didYouMean) {
      didYouMean.replaceChildren();
      if (count === 0 && query) {
        const suggestions = searchTools.suggest(query, 3);
        if (suggestions.length > 0) {
          didYouMean.hidden = false;
          const label = document.createElement('span');
          label.textContent = 'Did you mean: ';
          didYouMean.append(label);
          suggestions.forEach((sug) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chip chip-sm';
            btn.dataset.didYouMeanOption = sug;
            btn.textContent = sug;
            didYouMean.append(btn);
          });
        } else {
          didYouMean.hidden = true;
        }
      } else {
        didYouMean.hidden = true;
      }
    }

    if (pagination) pagination.hidden = displayed >= count;
    if (loadMoreButton) {
      loadMoreButton.textContent =
        'Show ' + Math.min(DIRECTORY_BATCH_SIZE, count - displayed) + ' more tools';
    }

    renderActiveFilters();
    if (updateHistory) syncUrl();
  };

  // Autocomplete dropdown while typing
  const updateAutocomplete = () => {
    if (!autocompleteBox || !search) return;
    const q = search.value.trim();
    if (q.length < 2) {
      autocompleteBox.hidden = true;
      autocompleteBox.replaceChildren();
      return;
    }
    const items = searchTools.autocomplete(q, 6);
    if (!items.length || (items.length === 1 && items[0].toLowerCase() === q.toLowerCase())) {
      autocompleteBox.hidden = true;
      autocompleteBox.replaceChildren();
      return;
    }
    autocompleteBox.replaceChildren();
    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'autocomplete-item';
      btn.dataset.autocompleteValue = item;
      btn.textContent = item;
      autocompleteBox.append(btn);
    });
    autocompleteBox.hidden = false;
  };

  const shareResults = async () => {
    if (!shareStatus || !shareFallback) return;
    shareFallback.hidden = true;
    const url = window.location.href;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      shareStatus.textContent = 'Link to these results copied.';
    } catch {
      shareFallback.value = url;
      shareFallback.hidden = false;
      shareStatus.textContent = 'Could not copy automatically. Select the link below and copy it.';
      shareFallback.focus();
      shareFallback.select();
    }
  };

  const setFiltersOpen = (open: boolean, returnFocus = false) => {
    root.dataset.filtersOpen = String(open);
    filterToggle?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('filters-locked', open);
    if (open) filterPanel?.focus();
    else if (returnFocus) filterToggle?.focus();
  };

  const desktopLayout = window.matchMedia('(min-width: 881px)');
  desktopLayout.addEventListener('change', () => {
    if (!desktopLayout.matches || root.dataset.filtersOpen !== 'true') return;
    const focusWasInside = filterPanel?.contains(document.activeElement);
    setFiltersOpen(false);
    if (focusWasInside) search?.focus();
  });

  const clearFacets = () => {
    root
      .querySelectorAll<HTMLInputElement>('.filter-panel input[type="checkbox"]')
      .forEach((input) => {
        if (!input.disabled && input.name !== 'showHidden') input.checked = false;
      });
    root.querySelectorAll<HTMLInputElement>('input[name="recency"]').forEach((radio) => {
      radio.checked = radio.value === '';
    });
    activeLetter = '';
    azButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String((btn.dataset.letter || '') === ''));
    });
  };

  const clearFilters = () => {
    if (search) search.value = '';
    if (autocompleteBox) autocompleteBox.hidden = true;
    clearFacets();
    if (sort) sort.value = 'relevance';
    apply();
  };

  const applyPreset = (kind: string, categoryId: string) => {
    clearFacets();
    if (kind === 'all') {
      if (search) search.value = '';
    } else if (kind === 'open-source') {
      if (openSource) openSource.checked = true;
    } else if (kind === 'free') {
      const input = root.querySelector<HTMLInputElement>('input[name="pricing"][value="free"]');
      if (input) input.checked = true;
    } else if (kind === 'category' && categoryId) {
      const input = root.querySelector<HTMLInputElement>(
        'input[name="category"][value="' + CSS.escape(categoryId) + '"]',
      );
      if (input) input.checked = true;
    }
    apply();
  };

  search?.addEventListener('input', () => {
    updateAutocomplete();
    apply();
  });
  search?.addEventListener('change', () => {
    if (search.value.trim()) recordRecentSearch(search.value);
  });
  search?.addEventListener('blur', () => {
    window.setTimeout(() => {
      if (autocompleteBox) autocompleteBox.hidden = true;
    }, 150);
  });

  sort?.addEventListener('change', () => apply());
  root
    .querySelectorAll<HTMLInputElement>('.filter-panel input:not([data-facet-search])')
    .forEach((input) => input.addEventListener('change', () => apply()));

  // Filter within a long facet list
  facetSearch?.addEventListener('input', () => {
    const q = facetSearch.value.trim().toLowerCase();
    root.querySelectorAll<HTMLElement>('.filter-panel [data-facet-label]').forEach((label) => {
      const text = label.dataset.facetLabel || '';
      label.hidden = Boolean(q && !text.includes(q));
    });
  });

  // Guided finder & Hero search integration
  const heroForm = document.querySelector<HTMLFormElement>('[data-hero-search]');
  heroForm?.addEventListener('submit', (event) => {
    const queryInput = heroForm.querySelector<HTMLInputElement>('input[name="q"]');
    if (!queryInput || !search) return;
    event.preventDefault();
    search.value = queryInput.value.trim();
    recordRecentSearch(search.value);
    apply();
    root.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    search.focus({ preventScroll: true });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-guided-goal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearFacets();
      if (search) search.value = btn.dataset.goalQuery || '';
      const cat = btn.dataset.goalCategory || '';
      if (cat) {
        const input = root.querySelector<HTMLInputElement>(
          'input[name="category"][value="' + CSS.escape(cat) + '"]',
        );
        if (input) input.checked = true;
      }
      if (btn.dataset.goalOss === 'true' && openSource) {
        openSource.checked = true;
      }
      apply();
      root.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  });

  root.addEventListener('click', (event) => {
    const el = event.target instanceof Element ? event.target : null;
    const metaSpan = el?.closest<HTMLElement>('.tool-meta > span');
    if (metaSpan) {
      const card = metaSpan.closest<HTMLElement>('[data-tool-card]');
      if (card) {
        if (metaSpan.classList.contains('badge-accent')) {
          if (openSource) {
            openSource.checked = !openSource.checked;
            apply();
          }
        } else if (metaSpan.classList.contains('badge')) {
          const pricingId = card.dataset.pricing || '';
          const input = pricingId
            ? root.querySelector<HTMLInputElement>(
                'input[name="pricing"][value="' + CSS.escape(pricingId) + '"]',
              )
            : null;
          if (input) {
            input.checked = !input.checked;
            apply();
          }
        } else {
          const subId = card.dataset.subcategory || '';
          const catId = card.dataset.category || '';
          const subInput = subId
            ? root.querySelector<HTMLInputElement>(
                'input[name="subcategory"][value="' + CSS.escape(subId) + '"]',
              )
            : null;
          const catInput = catId
            ? root.querySelector<HTMLInputElement>(
                'input[name="category"][value="' + CSS.escape(catId) + '"]',
              )
            : null;
          const targetInput = subInput || catInput;
          if (targetInput) {
            targetInput.checked = !targetInput.checked;
            apply();
          }
        }
      }
      return;
    }

    const target = el ? el.closest<HTMLElement>('button') : null;
    if (!target) return;

    if (target.dataset.presetFilter !== undefined) {
      applyPreset(target.dataset.presetFilter, target.dataset.presetCategory || '');
    } else if (target.dataset.letter !== undefined) {
      activeLetter = target.dataset.letter;
      azButtons.forEach((btn) =>
        btn.setAttribute('aria-pressed', String((btn.dataset.letter || '') === activeLetter)),
      );
      apply();
    } else if (target.dataset.autocompleteValue !== undefined) {
      if (search) {
        const val = target.dataset.autocompleteValue;
        const parts = search.value.trim().split(/\s+/);
        if (val.includes(':') && parts.length > 1) {
          parts[parts.length - 1] = val;
          search.value = parts.join(' ') + ' ';
        } else {
          search.value = val;
        }
        recordRecentSearch(search.value);
      }
      if (autocompleteBox) autocompleteBox.hidden = true;
      apply();
    } else if (target.dataset.didYouMeanOption !== undefined) {
      if (search) {
        search.value = target.dataset.didYouMeanOption;
        recordRecentSearch(search.value);
      }
      apply();
    } else if (target.dataset.applyRecentSearch !== undefined) {
      if (search) search.value = target.dataset.applyRecentSearch;
      apply();
    } else if (target.dataset.clearRecentSearches !== undefined) {
      writeStringList(RECENT_SEARCHES_KEY, []);
      renderRecentSearches();
    } else if (target.dataset.saveSearch !== undefined) {
      const qs = getUrlSearchParams().toString();
      if (!qs) {
        showToast('Add a search term or filter before saving a preset.');
        return;
      }
      const defaultName = search?.value.trim() || 'Filtered view';
      const presets = readSavedSearches();
      const id = 's-' + Date.now();
      presets.unshift({ id, name: defaultName.slice(0, 32), query: qs });
      writeSavedSearches(presets.slice(0, 8));
      renderSavedSearches();
      showToast('Saved search preset “' + defaultName.slice(0, 32) + '”.');
    } else if (target.dataset.applySavedSearch !== undefined) {
      readStateFromUrl('?' + target.dataset.applySavedSearch);
      apply();
    } else if (target.dataset.deleteSavedSearch !== undefined) {
      const id = target.dataset.deleteSavedSearch;
      writeSavedSearches(readSavedSearches().filter((p) => p.id !== id));
      renderSavedSearches();
    } else if (target.dataset.surpriseMe !== undefined) {
      const visibleCards = cards.filter((c) => !c.hidden);
      const pool = visibleCards.length > 0 ? visibleCards : cards;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const link = pick?.querySelector<HTMLAnchorElement>('.tool-name a');
      if (link) location.href = link.href;
    } else if (target.dataset.clearFilters !== undefined) {
      clearFilters();
      search?.focus();
    } else if (target.dataset.removeQuery !== undefined) {
      if (search) search.value = '';
      apply();
      search?.focus();
    } else if (target.dataset.removeLetter !== undefined) {
      activeLetter = '';
      azButtons.forEach((btn) =>
        btn.setAttribute('aria-pressed', String((btn.dataset.letter || '') === '')),
      );
      apply();
    } else if (target.dataset.removeRecency !== undefined) {
      root.querySelectorAll<HTMLInputElement>('input[name="recency"]').forEach((r) => {
        r.checked = r.value === '';
      });
      apply();
    } else if (target.dataset.removeFilterName && target.dataset.removeFilterValue) {
      const input = root.querySelector<HTMLInputElement>(
        'input[name="' +
          target.dataset.removeFilterName +
          '"][value="' +
          CSS.escape(target.dataset.removeFilterValue) +
          '"]',
      );
      if (input) input.checked = false;
      apply();
    } else if (target.dataset.loadMore !== undefined) {
      const previousShown = Number(visibleCount?.textContent || '0');
      batches += 1;
      apply(false);
      const visibleTitles = results?.querySelectorAll<HTMLAnchorElement>(
        '[data-tool-card]:not([hidden]) .tool-name a',
      );
      visibleTitles?.[previousShown]?.focus();
    } else if (target.dataset.shareResults !== undefined) {
      void shareResults();
    } else if (target.dataset.viewButton) {
      setView(target.dataset.viewButton);
      syncUrl();
    } else if (target.dataset.filterToggle !== undefined) {
      setFiltersOpen(root.dataset.filtersOpen !== 'true');
    } else if (target.dataset.filterClose !== undefined) {
      setFiltersOpen(false, true);
    }
  });

  // Optional infinite scroll
  if (pagination && infiniteScrollToggle) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!infiniteScrollToggle.checked) return;
        if (entries.some((e) => e.isIntersecting) && !pagination.hidden) {
          batches += 1;
          apply(false);
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(pagination);
  }

  // Keyboard navigation (j / k, Enter, s save, c compare, / search)
  document.addEventListener('keydown', (event) => {
    const filtersOpen = root.dataset.filtersOpen === 'true';
    if (event.key === 'Escape' && filtersOpen) {
      setFiltersOpen(false, true);
      return;
    }
    if (event.key === 'Tab' && filtersOpen && filterPanel) {
      const focusable = [
        ...filterPanel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => element.getClientRects().length > 0 && !element.hidden);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        event.preventDefault();
        filterPanel.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === filterPanel)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!filterPanel.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
      return;
    }

    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    if (
      isTyping ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.isComposing ||
      document.querySelector('dialog[open]')
    ) {
      return;
    }

    if (event.key === '/' && !event.shiftKey && search) {
      event.preventDefault();
      if (filtersOpen) setFiltersOpen(false);
      search.focus();
      search.select();
      return;
    }

    const visibleCards = [
      ...(results?.querySelectorAll<HTMLElement>('[data-tool-card]:not([hidden])') ?? []),
    ];
    if (!visibleCards.length) return;

    if (event.key === 'j' || event.key === 'k') {
      event.preventDefault();
      visibleCards.forEach((c) => c.classList.remove('is-kb-focused'));
      if (event.key === 'j') {
        kbFocusIndex = Math.min(visibleCards.length - 1, kbFocusIndex + 1);
      } else {
        kbFocusIndex = Math.max(0, kbFocusIndex <= 0 ? 0 : kbFocusIndex - 1);
      }
      const focused = visibleCards[kbFocusIndex];
      if (focused) {
        focused.classList.add('is-kb-focused');
        focused.scrollIntoView({
          block: 'nearest',
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
        focused.querySelector<HTMLAnchorElement>('.tool-name a')?.focus({ preventScroll: true });
      }
    } else if (kbFocusIndex >= 0 && visibleCards[kbFocusIndex]) {
      const currentCard = visibleCards[kbFocusIndex];
      if (event.key === 's') {
        event.preventDefault();
        currentCard.querySelector<HTMLButtonElement>('[data-save-tool]')?.click();
      } else if (event.key === 'c') {
        event.preventDefault();
        currentCard.querySelector<HTMLButtonElement>('[data-compare-tool]')?.click();
      } else if (
        event.key === 'Enter' &&
        document.activeElement !== currentCard.querySelector('.tool-name a')
      ) {
        const link = currentCard.querySelector<HTMLAnchorElement>('.tool-name a');
        if (link) location.href = link.href;
      }
    }
  });

  // Restore search & filter state on browser history navigation
  window.addEventListener('popstate', () => {
    readStateFromUrl(window.location.search);
    apply(true, false);
  });

  // Re-apply when hidden tools change
  document.addEventListener('awt:hidden-changed', () => apply(false, false));

  // Scroll-position restoration on back navigation
  const scrollKey = 'awt:scroll:' + location.pathname;
  try {
    const savedScroll = sessionStorage.getItem(scrollKey);
    if (savedScroll) {
      const y = Number(savedScroll);
      if (Number.isFinite(y) && y > 0) {
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }
    window.addEventListener(
      'pagehide',
      () => {
        try {
          sessionStorage.setItem(scrollKey, String(window.scrollY));
        } catch {
          /* best effort */
        }
      },
      { passive: true },
    );
  } catch {
    /* sessionStorage unavailable */
  }

  renderRecentSearches();
  renderSavedSearches();
  apply(true, false);

  if (initParams.get('search') === '1' && search) {
    search.focus();
    const url = new URL(location.href);
    url.searchParams.delete('search');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
}
