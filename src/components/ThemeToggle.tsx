import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { currentTheme, setTheme, type Theme } from '../lib/theme';
import { cn } from '../lib/cn';

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setLocal] = useState<Theme>(() => (typeof document === 'undefined' ? 'light' : currentTheme()));

  useEffect(() => {
    const onChange = (e: Event) => setLocal((e as CustomEvent<Theme>).detail);
    window.addEventListener('rajamine-theme', onChange);
    return () => window.removeEventListener('rajamine-theme', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setLocal(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      data-tour="theme-toggle"
      className={cn('press relative p-2.5 rounded-xl text-secondary hover:bg-primary/5 cursor-pointer', className)}
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
