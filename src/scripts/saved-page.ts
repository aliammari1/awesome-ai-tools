const KEY = 'awt:saved-tools:v1';

const readSaved = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? new Set(parsed) : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

export function initSavedPage() {
  const render = () => {
    const saved = readSaved();
    let count = 0;

    document.querySelectorAll<HTMLElement>('[data-saved-wrapper]').forEach((wrapper) => {
      const show = saved.has(wrapper.dataset.savedWrapper || '');
      wrapper.hidden = !show;
      if (show) count += 1;
    });

    const empty = document.querySelector<HTMLElement>('#no-saved-tools');
    if (empty) empty.hidden = count > 0;
  };

  document.addEventListener('awt:saved-changed', render);
  render();
}
