// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, currentTheme, setTheme, getStoredTheme } from '../src/lib/theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('Tema claro/escuro', () => {
  it('aplica e persiste o tema', () => {
    setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(currentTheme()).toBe('dark');
    expect(getStoredTheme()).toBe('dark');
    setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(currentTheme()).toBe('light');
  });

  it('applyTheme atualiza color-scheme e meta theme-color', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
    applyTheme('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(meta.getAttribute('content')).toBe('#0b0d10');
    applyTheme('light');
    expect(meta.getAttribute('content')).toBe('#f5f6f8');
  });
});
