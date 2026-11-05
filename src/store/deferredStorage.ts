import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * Armazenamento do `persist` com gravação adiada.
 *
 * Por padrão o Zustand faz `JSON.stringify` do estado inteiro (relatórios,
 * auditoria, notificações) e grava no localStorage de forma síncrona a CADA
 * `set` — na main thread, no meio de um clique ou de uma digitação. Aqui o
 * último estado fica em memória e só é serializado uma vez, 400 ms depois da
 * última alteração, ou imediatamente ao esconder/fechar a aba (`pagehide`,
 * `visibilitychange`), para não perder nada.
 * A leitura enxerga o estado pendente, então o app nunca vê dado velho.
 */
export function createDeferredStorage<S>(delayMs = 400): PersistStorage<S> {
  const pending = new Map<string, StorageValue<S>>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    for (const [key, value] of pending) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* cota cheia ou modo privado: segue em memória */ }
    }
    pending.clear();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  }

  return {
    getItem: (key) => {
      const queued = pending.get(key);
      if (queued) return queued;
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as StorageValue<S>) : null;
      } catch { return null; }
    },
    setItem: (key, value) => {
      pending.set(key, value);
      if (!timer) timer = setTimeout(flush, delayMs);
    },
    removeItem: (key) => {
      pending.delete(key);
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    },
  };
}
