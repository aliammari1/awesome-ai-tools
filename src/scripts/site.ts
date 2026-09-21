const SAVED_KEY = 'awt:saved-tools:v1';
const COMPARE_KEY = 'awt:compare-tools:v1';
const MAX_COMPARE = 3;

const readList = (key: string) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

const writeList = (key: string, list: string[]) => {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch {}
};

const announce = (message: string) => {
  const region = document.querySelector<HTMLElement>('[data-site-status]');
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
};

const syncSaved = () => {
  const saved = new Set(readList(SAVED_KEY));
  document.querySelectorAll<HTMLButtonElement>('[data-save-tool]').forEach((button) => {
    const id = button.dataset.saveTool || '';
    const active = saved.has(id);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? 'Saved' : 'Save';
  });
};

const syncCompare = () => {
  const compare = readList(COMPARE_KEY).slice(0, MAX_COMPARE);
  const selected = new Set(compare);

  document.querySelectorAll<HTMLButtonElement>('[data-compare-tool]').forEach((button) => {
    const id = button.dataset.compareTool || '';
    const active = selected.has(id);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? 'Comparing' : 'Compare';
  });

  const tray = document.querySelector<HTMLElement>('[data-compare-tray]');
  const count = document.querySelector<HTMLElement>('[data-compare-count]');
  const link = document.querySelector<HTMLAnchorElement>('[data-compare-link]');
  if (count) count.textContent = String(compare.length);
  if (tray) tray.hidden = compare.length === 0;
  if (link) {
    const locale = document.body.dataset.locale || 'en';
    link.href = '/' + locale + '/compare/?ids=' + encodeURIComponent(compare.join(','));
  }
};

document.addEventListener('click', (event) => {
  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;

  const saveButton = element.closest<HTMLButtonElement>('[data-save-tool]');
  if (saveButton) {
    const id = saveButton.dataset.saveTool;
    if (!id) return;
    const saved = readList(SAVED_KEY);
    const index = saved.indexOf(id);
    if (index >= 0) {
      saved.splice(index, 1);
      announce('Removed from saved tools.');
    } else {
      saved.push(id);
      announce('Saved tool.');
    }
    writeList(SAVED_KEY, saved);
    syncSaved();
    document.dispatchEvent(new CustomEvent('awt:saved-changed'));
    return;
  }

  const compareButton = element.closest<HTMLButtonElement>('[data-compare-tool]');
  if (compareButton) {
    const id = compareButton.dataset.compareTool;
    if (!id) return;
    const compare = readList(COMPARE_KEY);
    const index = compare.indexOf(id);

    if (index >= 0) {
      compare.splice(index, 1);
      announce('Removed from comparison.');
    } else if (compare.length >= MAX_COMPARE) {
      announce('You can compare up to three tools. Remove one first.');
      return;
    } else {
      compare.push(id);
      announce('Added to comparison.');
    }

    writeList(COMPARE_KEY, compare);
    syncCompare();
    document.dispatchEvent(new CustomEvent('awt:compare-changed'));
    return;
  }

  const clearCompare = element.closest<HTMLButtonElement>('[data-clear-compare]');
  if (clearCompare) {
    writeList(COMPARE_KEY, []);
    syncCompare();
    document.dispatchEvent(new CustomEvent('awt:compare-changed'));
    announce('Comparison cleared.');
    return;
  }

  const searchShortcut = element.closest<HTMLButtonElement>('[data-search-shortcut]');
  if (searchShortcut) {
    const search = document.querySelector<HTMLInputElement>('#tool-search');
    if (search) {
      search.focus();
      search.select();
      search.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else {
      const locale = document.body.dataset.locale || 'en';
      window.location.href = '/' + locale + '/#directory';
    }
  }
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    const search = document.querySelector<HTMLInputElement>('#tool-search');
    if (search) {
      event.preventDefault();
      search.focus();
      search.select();
    }
  }
});

syncSaved();
syncCompare();
