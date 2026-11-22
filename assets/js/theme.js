(() => {
  'use strict';
  const key = 'yuerong-portfolio-theme';
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const valid = (value) => ['light', 'dark'].includes(value) ? value : null;
  let choice = null;
  try { choice = valid(localStorage.getItem(key)); } catch {}
  function apply() {
    const theme = choice || (system.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#171717' : '#ffffff';
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const dark = theme === 'dark';
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    button.setAttribute('aria-label', 'Dark mode');
    button.setAttribute('aria-pressed', String(dark));
    button.title = label;
    button.innerHTML = `<i data-lucide="${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    window.lucide?.createIcons();
  }
  apply();
  function bind() {
    apply();
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      choice = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, choice); } catch {}
      apply();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  system.addEventListener('change', () => { if (!choice) apply(); });
  window.addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) { choice = valid(event.newValue); apply(); }
  });
})();
