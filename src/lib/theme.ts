/* Tema claro/escuro persistido. Aplicado antes do primeiro paint (index.html). */
export type Theme = 'light' | 'dark';
const KEY = 'safip-theme';

export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function preferredTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0d10' : '#eeede9');
}

export function setTheme(theme: Theme) {
  try { localStorage.setItem(KEY, theme); } catch { /* modo privado */ }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('safip-theme', { detail: theme }));
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
