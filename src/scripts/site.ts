import { matchLocale } from '../lib/locales';
import { MAX_COMPARE_TOOLS, STORAGE_KEYS } from '../lib/workspace';

const LOCALE_KEY = STORAGE_KEYS.LOCALE;
const LOCALE_DISMISSED_KEY = STORAGE_KEYS.LOCALE_DISMISSED;
const SAVED_KEY = STORAGE_KEYS.SAVED;
const COMPARE_KEY = STORAGE_KEYS.COMPARE;
const STACK_KEY = STORAGE_KEYS.STACK;
const HIDDEN_KEY = STORAGE_KEYS.HIDDEN;
const RECENT_TOOLS_KEY = STORAGE_KEYS.RECENT_TOOLS;
const THEME_KEY = STORAGE_KEYS.THEME;
const PREFS_KEY = STORAGE_KEYS.PREFS;
const MAX_COMPARE = MAX_COMPARE_TOOLS;

const prefersReducedMotion = () =>
  document.documentElement.dataset.motion === 'reduce' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const readList = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
};

const writeList = (key: string, list: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* saved/compare state is best-effort; storage may be unavailable */
  }
};

const announce = (message: string) => {
  const region = document.querySelector<HTMLElement>('[data-site-status]');
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
};

interface ToastOptions {
  undoLabel?: string;
  onUndo?: () => void;
}

export const showToast = (message: string, options?: ToastOptions) => {
  announce(message);
  const region = document.querySelector<HTMLElement>('[data-toast-region]');
  if (!region) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  const text = document.createElement('span');
  text.textContent = message;
  toast.append(text);

  let timer = 0;
  const dismiss = () => {
    window.clearTimeout(timer);
    toast.remove();
  };

  if (options?.onUndo) {
    const undo = document.createElement('button');
    undo.type = 'button';
    undo.className = 'toast-action';
    undo.textContent = options.undoLabel || 'Undo';
    undo.addEventListener('click', () => {
      options.onUndo?.();
      dismiss();
    });
    toast.append(undo);
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'toast-dismiss';
  close.setAttribute('aria-label', 'Dismiss notification');
  const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  closeSvg.setAttribute('class', 'icon');
  closeSvg.setAttribute('aria-hidden', 'true');
  const closeUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  closeUse.setAttribute('href', '#i-close');
  closeSvg.append(closeUse);
  close.append(closeSvg);
  close.addEventListener('click', dismiss);
  toast.append(close);

  region.replaceChildren(toast);
  timer = window.setTimeout(dismiss, 5000);
};

const setPressed = (button: HTMLButtonElement, active: boolean) => {
  button.setAttribute('aria-pressed', String(active));
  const label = button.querySelector<HTMLElement>('[data-pressed-label]');
  if (!label) return;
  label.dataset.defaultLabel ??= label.textContent ?? '';
  label.textContent = active ? (label.dataset.pressedLabel ?? '') : label.dataset.defaultLabel;
};

const syncSaved = () => {
  const saved = new Set(readList(SAVED_KEY));
  document.querySelectorAll<HTMLButtonElement>('[data-save-tool]').forEach((button) => {
    setPressed(button, saved.has(button.dataset.saveTool || ''));
  });

  document.querySelectorAll<HTMLElement>('[data-saved-count]').forEach((badge) => {
    badge.textContent = String(saved.size);
    badge.hidden = saved.size === 0;
  });
};

const syncStack = () => {
  const stack = new Set(readList(STACK_KEY));
  document.querySelectorAll<HTMLButtonElement>('[data-use-tool]').forEach((button) => {
    setPressed(button, stack.has(button.dataset.useTool || ''));
  });
};

const syncHidden = () => {
  const hidden = new Set(readList(HIDDEN_KEY));
  document.querySelectorAll<HTMLButtonElement>('[data-hide-tool]').forEach((button) => {
    setPressed(button, hidden.has(button.dataset.hideTool || ''));
  });
};

const syncCompare = () => {
  const compare = readList(COMPARE_KEY).slice(0, MAX_COMPARE);
  const selected = new Set(compare);

  document.querySelectorAll<HTMLButtonElement>('[data-compare-tool]').forEach((button) => {
    setPressed(button, selected.has(button.dataset.compareTool || ''));
  });

  const tray = document.querySelector<HTMLElement>('[data-compare-tray]');
  const count = document.querySelector<HTMLElement>('[data-compare-count]');
  const link = document.querySelector<HTMLAnchorElement>('[data-compare-link]');
  const onComparePage = /^\/[a-z-]+\/compare\/?$/.test(location.pathname);
  const showTray = compare.length > 0 && !onComparePage;
  if (count) count.textContent = String(compare.length);
  if (tray) tray.hidden = !showTray;
  document.body.classList.toggle('has-compare-tray', showTray);
  const locale = document.body.dataset.locale || 'en';
  if (link) {
    link.href = '/' + locale + '/compare/?ids=' + encodeURIComponent(compare.join(','));
  }

  // Update quick-compare button on tool detail pages if a previous tool is in the tray
  const quickBtn = document.querySelector<HTMLAnchorElement>('[data-quick-compare]');
  if (quickBtn) {
    const currentId = quickBtn.dataset.quickCompare || '';
    const other = compare.filter((id) => id !== currentId).at(-1);
    if (other && currentId) {
      quickBtn.href =
        '/' + locale + '/compare/?ids=' + encodeURIComponent([other, currentId].join(','));
      quickBtn.hidden = false;
    } else {
      quickBtn.hidden = true;
    }
  }
};

const recordRecentTool = () => {
  const detailNode = document.querySelector<HTMLElement>('[data-tool-detail-id]');
  const toolId = detailNode?.dataset.toolDetailId;
  if (!toolId) return;
  const recent = readList(RECENT_TOOLS_KEY).filter((id) => id !== toolId);
  recent.unshift(toolId);
  writeList(RECENT_TOOLS_KEY, recent.slice(0, 12));
};

const toolName = (element: Element) =>
  element.closest('[data-tool-card]')?.querySelector('.tool-name')?.textContent?.trim() ||
  document.querySelector('h1')?.textContent?.trim() ||
  'tool';

/** Keep search, filters and the section anchor when switching language. */
const carryState = (link: HTMLAnchorElement) => {
  const base = link.getAttribute('href')?.split(/[?#]/)[0] ?? '';
  link.setAttribute('href', base + location.search + location.hash);
};

const readValue = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

interface LanguageSuggestion {
  href: string;
  lang: string;
  dir: string;
  message: string;
  action: string;
  dismiss: string;
}

/** Offer, never force, the visitor's preferred language. */
const initLanguageBanner = () => {
  const slot = document.querySelector<HTMLElement>('[data-lang-banner-slot]');
  const dataNode = document.querySelector<HTMLScriptElement>('#lang-suggest-data');
  if (!slot || !dataNode) return;

  let suggestions: Record<string, LanguageSuggestion>;
  try {
    suggestions = JSON.parse(dataNode.textContent || '{}') as Record<string, LanguageSuggestion>;
  } catch {
    return;
  }

  const stored = readValue(LOCALE_KEY);
  const preferred =
    stored && stored in suggestions ? stored : stored ? null : matchLocale(navigator.languages);
  if (!preferred || !(preferred in suggestions)) return;
  if (readValue(LOCALE_DISMISSED_KEY) === preferred) return;

  const suggestion = suggestions[preferred];
  const banner = document.createElement('div');
  banner.className = 'lang-banner';
  banner.lang = suggestion.lang;
  banner.dir = suggestion.dir;
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', suggestion.message);

  const message = document.createElement('p');
  message.textContent = suggestion.message;
  const link = document.createElement('a');
  link.href = suggestion.href + location.search + location.hash;
  link.hreflang = suggestion.lang;
  link.textContent = suggestion.action;
  link.addEventListener('click', () => {
    try {
      localStorage.setItem(LOCALE_KEY, preferred);
    } catch {
      /* best effort */
    }
  });
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = suggestion.dismiss;
  dismiss.addEventListener('click', () => {
    try {
      localStorage.setItem(LOCALE_DISMISSED_KEY, preferred);
    } catch {
      /* best effort */
    }
    banner.remove();
  });

  banner.append(message, link, dismiss);
  slot.replaceChildren(banner);
};

interface A11yPrefs {
  textSize?: 'default' | 'large';
  reducedMotion?: boolean;
}

const readPrefs = (): A11yPrefs => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const writePrefs = (prefs: A11yPrefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* best effort */
  }
};

const syncPrefs = () => {
  const prefs = readPrefs();
  const root = document.documentElement;
  if (prefs.textSize === 'large') root.dataset.textSize = 'large';
  else delete root.dataset.textSize;

  if (prefs.reducedMotion) root.dataset.motion = 'reduce';
  else delete root.dataset.motion;

  document.querySelectorAll<HTMLButtonElement>('[data-text-size-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(prefs.textSize === 'large'));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(Boolean(prefs.reducedMotion)));
  });
};

const toggleTheme = () => {
  const root = document.documentElement;
  const isDark =
    root.dataset.theme === 'dark' ||
    (root.dataset.theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* the choice still applies to this page view */
  }
  showToast('Switched to ' + next + ' theme.');
};

// Command Palette (⌘K / Ctrl+K)
interface CmdItem {
  kind: 'Action' | 'Page' | 'Domain' | 'Tool';
  label: string;
  sub: string;
  href?: string;
  run?: () => void;
}

let cachedApiTools: Array<{
  id: string;
  name: string;
  description: string;
  categoryName?: string;
}> | null = null;
let cachedApiCategories: Array<{ id: string; name: string; description: string }> | null = null;

const loadPaletteData = async () => {
  if (cachedApiTools && cachedApiCategories) return;
  try {
    const [toolsRes, catsRes] = await Promise.all([
      fetch('/api/tools.json'),
      fetch('/api/categories.json'),
    ]);
    if (toolsRes.ok) {
      const data = await toolsRes.json();
      if (Array.isArray(data.tools)) cachedApiTools = data.tools;
    }
    if (catsRes.ok) {
      const data = await catsRes.json();
      if (Array.isArray(data.categories)) cachedApiCategories = data.categories;
    }
  } catch {
    /* fallback to DOM elements if offline */
  }
};

const initCommandPalette = () => {
  const dialog = document.querySelector<HTMLDialogElement>('[data-cmd-dialog]');
  const input = dialog?.querySelector<HTMLInputElement>('[data-cmd-input]');
  const list = dialog?.querySelector<HTMLElement>('[data-cmd-results]');
  if (!dialog || !input || !list) return null;

  let activeIndex = 0;
  let currentItems: CmdItem[] = [];

  const getBaseItems = (): CmdItem[] => {
    const locale = document.body.dataset.locale || 'en';
    const prefix = '/' + locale;

    const actions: CmdItem[] = [
      {
        kind: 'Action',
        label: 'Surprise me (random tool)',
        sub: 'Jump to a random catalog entry',
        run: async () => {
          await loadPaletteData();
          const pool =
            cachedApiTools?.map((t) => t.id) ??
            [...document.querySelectorAll<HTMLElement>('[data-tool-id]')]
              .map((el) => el.dataset.toolId || '')
              .filter(Boolean);
          if (pool.length > 0) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            location.href = `${prefix}/tools/${pick}/`;
          }
        },
      },
      {
        kind: 'Action',
        label: 'Toggle color theme',
        sub: 'Switch between light and dark mode',
        run: () => toggleTheme(),
      },
      {
        kind: 'Action',
        label: 'Toggle larger text',
        sub: 'Increase base font size across the site',
        run: () => {
          const prefs = readPrefs();
          prefs.textSize = prefs.textSize === 'large' ? 'default' : 'large';
          writePrefs(prefs);
          syncPrefs();
          showToast(
            prefs.textSize === 'large' ? 'Larger text enabled.' : 'Default text size restored.',
          );
        },
      },
      {
        kind: 'Action',
        label: 'Keyboard shortcuts (?)',
        sub: 'View all keyboard navigation shortcuts',
        run: () => {
          document.querySelector<HTMLDialogElement>('[data-shortcuts-dialog]')?.showModal();
        },
      },
    ];

    const pages: CmdItem[] = [
      {
        kind: 'Page',
        label: 'Directory',
        sub: 'Browse & filter all AI tools',
        href: `${prefix}/#directory`,
      },
      {
        kind: 'Page',
        label: 'Curated collections',
        sub: 'Focused starting points',
        href: `${prefix}/collections/`,
      },
      {
        kind: 'Page',
        label: 'Saved workspace',
        sub: 'Your local lists, notes & stack',
        href: `${prefix}/saved/`,
      },
      {
        kind: 'Page',
        label: 'Compare tools',
        sub: 'Side-by-side metadata comparison',
        href: `${prefix}/compare/`,
      },
      {
        kind: 'Page',
        label: 'Catalog insights',
        sub: 'Counts by domain & open-source share',
        href: `${prefix}/insights/`,
      },
      {
        kind: 'Page',
        label: 'Changelog',
        sub: 'Recent additions & migrations',
        href: `${prefix}/changelog/`,
      },
      {
        kind: 'Page',
        label: 'Add / suggest a tool',
        sub: 'Schema builder & GitHub issue generator',
        href: `${prefix}/contribute/`,
      },
      {
        kind: 'Page',
        label: 'Methodology',
        sub: 'How entries are curated',
        href: `${prefix}/about/methodology/`,
      },
      {
        kind: 'Page',
        label: 'Privacy & local storage',
        sub: 'Inspect or wipe local browser data',
        href: `${prefix}/privacy/`,
      },
      {
        kind: 'Page',
        label: 'Link-health report',
        sub: 'Automated link check configuration',
        href: `${prefix}/link-health/`,
      },
    ];

    const domains: CmdItem[] = (cachedApiCategories ?? []).map((cat) => ({
      kind: 'Domain',
      label: cat.name,
      sub: cat.description,
      href: `${prefix}/categories/${cat.id}/`,
    }));

    const domTools: CmdItem[] =
      cachedApiTools?.map((tool) => ({
        kind: 'Tool',
        label: tool.name,
        sub: tool.description,
        href: `${prefix}/tools/${tool.id}/`,
      })) ??
      [...document.querySelectorAll<HTMLElement>('[data-tool-card]')].map((card) => ({
        kind: 'Tool',
        label: card.querySelector('.tool-name')?.textContent?.trim() || '',
        sub: card.querySelector('.tool-desc')?.textContent?.trim() || '',
        href: `${prefix}/tools/${card.dataset.toolId}/`,
      }));

    return [...actions, ...pages, ...domains, ...domTools];
  };

  const renderList = () => {
    const q = input.value.trim().toLowerCase();
    const all = getBaseItems();
    currentItems = q
      ? all
          .filter(
            (item) =>
              item.label.toLowerCase().includes(q) ||
              item.sub.toLowerCase().includes(q) ||
              item.kind.toLowerCase().includes(q),
          )
          .slice(0, 18)
      : all.slice(0, 14);

    if (activeIndex >= currentItems.length) activeIndex = 0;
    list.dataset.loading = 'false';
    list.replaceChildren();

    if (currentItems.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'cmd-empty';
      empty.textContent = 'No matching tools, domains or commands.';
      list.append(empty);
      return;
    }

    currentItems.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmd-item';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(index === activeIndex));

      const left = document.createElement('div');
      left.className = 'cmd-item-main';
      const title = document.createElement('strong');
      title.textContent = item.label;
      const sub = document.createElement('span');
      sub.textContent = item.sub;
      left.append(title, sub);

      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = item.kind;

      btn.append(left, badge);
      btn.addEventListener('click', () => {
        dialog.close();
        if (item.run) item.run();
        else if (item.href) location.href = item.href;
      });
      list.append(btn);
    });
  };

  input.addEventListener('input', () => {
    activeIndex = 0;
    renderList();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = currentItems.length ? (activeIndex + 1) % currentItems.length : 0;
      renderList();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = currentItems.length
        ? (activeIndex - 1 + currentItems.length) % currentItems.length
        : 0;
      renderList();
    } else if (event.key === 'Enter' && currentItems[activeIndex]) {
      event.preventDefault();
      const chosen = currentItems[activeIndex];
      dialog.close();
      if (chosen.run) chosen.run();
      else if (chosen.href) location.href = chosen.href;
    }
  });

  dialog.addEventListener('click', (event) => {
    if (
      event.target === dialog ||
      (event.target instanceof Element && event.target.closest('[data-cmd-close]'))
    ) {
      dialog.close();
    }
  });

  return {
    open: () => {
      if (!dialog.open) dialog.showModal();
      input.value = '';
      activeIndex = 0;
      renderList();
      input.focus();
      void loadPaletteData().then(() => {
        if (dialog.open) renderList();
      });
    },
  };
};

const cmdPalette = initCommandPalette();

const shortcutsDialog = document.querySelector<HTMLDialogElement>('[data-shortcuts-dialog]');
shortcutsDialog?.addEventListener('click', (event) => {
  if (
    event.target === shortcutsDialog ||
    (event.target instanceof Element && event.target.closest('[data-shortcuts-close]'))
  ) {
    shortcutsDialog.close();
  }
});

document.addEventListener('click', (event) => {
  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;

  const saveButton = element.closest<HTMLButtonElement>('[data-save-tool]');
  if (saveButton) {
    const id = saveButton.dataset.saveTool;
    if (!id) return;
    const saved = readList(SAVED_KEY);
    const index = saved.indexOf(id);
    const name = toolName(saveButton);
    if (index >= 0) {
      saved.splice(index, 1);
      writeList(SAVED_KEY, saved);
      syncSaved();
      document.dispatchEvent(new CustomEvent('awt:saved-changed'));
      showToast(name + ' removed from saved tools.', {
        undoLabel: 'Undo',
        onUndo: () => {
          const restored = readList(SAVED_KEY);
          if (!restored.includes(id)) restored.push(id);
          writeList(SAVED_KEY, restored);
          syncSaved();
          document.dispatchEvent(new CustomEvent('awt:saved-changed'));
        },
      });
    } else {
      saved.push(id);
      writeList(SAVED_KEY, saved);
      syncSaved();
      document.dispatchEvent(new CustomEvent('awt:saved-changed'));
      showToast(name + ' saved.');
    }
    return;
  }

  const useButton = element.closest<HTMLButtonElement>('[data-use-tool]');
  if (useButton) {
    const id = useButton.dataset.useTool;
    if (!id) return;
    const stack = readList(STACK_KEY);
    const index = stack.indexOf(id);
    const name = toolName(useButton);
    if (index >= 0) {
      stack.splice(index, 1);
      writeList(STACK_KEY, stack);
      syncStack();
      document.dispatchEvent(new CustomEvent('awt:workspace-changed'));
      showToast(name + ' removed from your personal stack.', {
        undoLabel: 'Undo',
        onUndo: () => {
          const restored = readList(STACK_KEY);
          if (!restored.includes(id)) restored.push(id);
          writeList(STACK_KEY, restored);
          syncStack();
          document.dispatchEvent(new CustomEvent('awt:workspace-changed'));
        },
      });
    } else {
      stack.push(id);
      writeList(STACK_KEY, stack);
      syncStack();
      document.dispatchEvent(new CustomEvent('awt:workspace-changed'));
      showToast(name + ' added to your personal stack.');
    }
    return;
  }

  const hideButton = element.closest<HTMLButtonElement>('[data-hide-tool]');
  if (hideButton) {
    const id = hideButton.dataset.hideTool;
    if (!id) return;
    const hidden = readList(HIDDEN_KEY);
    const index = hidden.indexOf(id);
    const name = toolName(hideButton);
    if (index >= 0) {
      hidden.splice(index, 1);
      writeList(HIDDEN_KEY, hidden);
      syncHidden();
      document.dispatchEvent(new CustomEvent('awt:hidden-changed'));
      showToast(name + ' unhidden.');
    } else {
      hidden.push(id);
      writeList(HIDDEN_KEY, hidden);
      syncHidden();
      document.dispatchEvent(new CustomEvent('awt:hidden-changed'));
      showToast(name + ' hidden from directory results.', {
        undoLabel: 'Undo',
        onUndo: () => {
          const current = readList(HIDDEN_KEY).filter((item) => item !== id);
          writeList(HIDDEN_KEY, current);
          syncHidden();
          document.dispatchEvent(new CustomEvent('awt:hidden-changed'));
        },
      });
    }
    return;
  }

  const compareButton = element.closest<HTMLButtonElement>('[data-compare-tool]');
  if (compareButton) {
    const id = compareButton.dataset.compareTool;
    if (!id) return;
    const compare = readList(COMPARE_KEY);
    const index = compare.indexOf(id);
    const name = toolName(compareButton);

    if (index >= 0) {
      compare.splice(index, 1);
      writeList(COMPARE_KEY, compare);
      syncCompare();
      document.dispatchEvent(new CustomEvent('awt:compare-changed'));
      showToast(name + ' removed from comparison.', {
        undoLabel: 'Undo',
        onUndo: () => {
          const restored = readList(COMPARE_KEY);
          if (restored.length < MAX_COMPARE && !restored.includes(id)) {
            restored.push(id);
            writeList(COMPARE_KEY, restored);
            syncCompare();
            document.dispatchEvent(new CustomEvent('awt:compare-changed'));
          }
        },
      });
    } else if (compare.length >= MAX_COMPARE) {
      showToast('You can compare up to three tools. Remove one first.');
      return;
    } else {
      compare.push(id);
      writeList(COMPARE_KEY, compare);
      syncCompare();
      document.dispatchEvent(new CustomEvent('awt:compare-changed'));
      showToast(name + ' added to comparison.');
    }
    return;
  }

  if (element.closest('[data-clear-compare]')) {
    const previous = readList(COMPARE_KEY);
    writeList(COMPARE_KEY, []);
    syncCompare();
    document.dispatchEvent(new CustomEvent('awt:compare-changed'));
    showToast('Comparison cleared.', {
      undoLabel: 'Undo',
      onUndo: () => {
        writeList(COMPARE_KEY, previous);
        syncCompare();
        document.dispatchEvent(new CustomEvent('awt:compare-changed'));
      },
    });
    return;
  }

  const sharePageBtn = element.closest<HTMLButtonElement>('[data-share-page]');
  if (sharePageBtn) {
    const shareTitle = sharePageBtn.dataset.shareTitle || document.title;
    const shareUrl = location.href;
    if (navigator.share) {
      void navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Page link copied to clipboard.');
      });
    }
    return;
  }

  const copyMdBtn = element.closest<HTMLButtonElement>('[data-copy-markdown]');
  if (copyMdBtn) {
    const md = copyMdBtn.dataset.copyMarkdown || '';
    if (md && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(md).then(() => {
        showToast('Markdown citation copied.');
      });
    }
    return;
  }

  const copyToolLinkBtn = element.closest<HTMLButtonElement>('[data-copy-tool-link]');
  if (copyToolLinkBtn) {
    const path = copyToolLinkBtn.dataset.copyToolLink || '';
    const fullUrl = new URL(path, location.origin).toString();
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('Link to tool copied.');
      });
    }
    return;
  }

  const languageLink = element.closest<HTMLAnchorElement>('[data-lang-link]');
  if (languageLink) {
    carryState(languageLink);
    try {
      localStorage.setItem(LOCALE_KEY, languageLink.dataset.langLink || '');
    } catch {
      /* the choice still applies to the page we are navigating to */
    }
    return;
  }

  const cmdOpen = element.closest<HTMLElement>('[data-cmd-open]');
  if (cmdOpen && cmdPalette) {
    event.preventDefault();
    cmdPalette.open();
    return;
  }

  if (element.closest('[data-shortcuts-open]')) {
    event.preventDefault();
    shortcutsDialog?.showModal();
    return;
  }

  if (element.closest('[data-text-size-toggle]')) {
    const prefs = readPrefs();
    prefs.textSize = prefs.textSize === 'large' ? 'default' : 'large';
    writePrefs(prefs);
    syncPrefs();
    showToast(prefs.textSize === 'large' ? 'Larger text enabled.' : 'Default text size restored.');
    return;
  }

  if (element.closest('[data-motion-toggle]')) {
    const prefs = readPrefs();
    prefs.reducedMotion = !prefs.reducedMotion;
    writePrefs(prefs);
    syncPrefs();
    showToast(prefs.reducedMotion ? 'Reduced motion enabled.' : 'Standard motion restored.');
    return;
  }

  if (element.closest('[data-theme-toggle]')) {
    toggleTheme();
  }
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
    if (cmdPalette) {
      event.preventDefault();
      cmdPalette.open();
    }
    return;
  }

  const target = event.target;
  const isTyping =
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

  if (
    event.key === '?' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !isTyping &&
    shortcutsDialog
  ) {
    event.preventDefault();
    if (shortcutsDialog.open) shortcutsDialog.close();
    else shortcutsDialog.showModal();
  }
});

// Cross-tab synchronization through the storage event
window.addEventListener('storage', (event) => {
  if (!event.key) return;
  if (event.key === SAVED_KEY || event.key === STORAGE_KEYS.LISTS) {
    syncSaved();
    document.dispatchEvent(new CustomEvent('awt:saved-changed'));
  } else if (event.key === COMPARE_KEY) {
    syncCompare();
    document.dispatchEvent(new CustomEvent('awt:compare-changed'));
  } else if (
    event.key === STACK_KEY ||
    event.key === STORAGE_KEYS.NOTES ||
    event.key === STORAGE_KEYS.TAGS
  ) {
    syncStack();
    document.dispatchEvent(new CustomEvent('awt:workspace-changed'));
  } else if (event.key === HIDDEN_KEY) {
    syncHidden();
    document.dispatchEvent(new CustomEvent('awt:hidden-changed'));
  } else if (event.key === THEME_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
    document.documentElement.dataset.theme = event.newValue;
  } else if (event.key === PREFS_KEY) {
    syncPrefs();
  }
});

document.querySelectorAll<HTMLDetailsElement>('[data-lang-switch]').forEach((details) => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    details
      .querySelectorAll<HTMLAnchorElement>('[data-lang-link]')
      .forEach((link) => carryState(link));
  });
});

document.addEventListener('click', (event) => {
  document.querySelectorAll<HTMLDetailsElement>('[data-lang-switch][open]').forEach((details) => {
    if (!(event.target instanceof Node) || !details.contains(event.target)) details.open = false;
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const open = document.querySelector<HTMLDetailsElement>('[data-lang-switch][open]');
  if (!open) return;
  open.open = false;
  open.querySelector('summary')?.focus();
});

const navToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');

const setNavOpen = (open: boolean) => {
  if (!navToggle || !mobileNav) return;
  navToggle.setAttribute('aria-expanded', String(open));
  mobileNav.hidden = !open;
};

navToggle?.addEventListener('click', () => {
  setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true');
});

mobileNav?.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a')) setNavOpen(false);
});

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest('[data-site-header]')) setNavOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
    setNavOpen(false);
    navToggle.focus();
  }
});

window.matchMedia('(min-width: 1241px)').addEventListener('change', (event) => {
  if (event.matches) setNavOpen(false);
});

// Back-to-top and scroll-progress affordances
const backToTop = document.querySelector<HTMLButtonElement>('[data-back-to-top]');
const scrollProgress = document.querySelector<HTMLElement>('[data-scroll-progress]');

if (backToTop || scrollProgress) {
  let queued = false;
  const updateScroll = () => {
    if (backToTop) backToTop.hidden = window.scrollY < 900;
    if (scrollProgress) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 100 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      scrollProgress.style.transform = `scaleX(${ratio.toFixed(3)})`;
    }
    queued = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(updateScroll);
    },
    { passive: true },
  );
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
  updateScroll();
}

// Link prefetching on hover/focus
const prefetched = new Set<string>();
const maybePrefetch = (event: Event) => {
  const link =
    event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
  if (!link) return;
  const href = link.getAttribute('href') || '';
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/#')) return;
  const cleanUrl = href.split('#')[0];
  if (!cleanUrl || prefetched.has(cleanUrl) || cleanUrl === location.pathname) return;
  prefetched.add(cleanUrl);
  const prefetchLink = document.createElement('link');
  prefetchLink.rel = 'prefetch';
  prefetchLink.href = cleanUrl;
  document.head.append(prefetchLink);
};
document.addEventListener('pointerenter', maybePrefetch, { capture: true, passive: true });
document.addEventListener('focusin', maybePrefetch, { passive: true });

// Installable PWA. Dev servers must not keep a worker that intercepts module requests.
const localHost =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '::1';
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) void registration.unregister();
  });
} else if ('serviceWorker' in navigator && (location.protocol === 'https:' || localHost)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

recordRecentTool();
syncSaved();
syncStack();
syncHidden();
syncCompare();
syncPrefs();
initLanguageBanner();
