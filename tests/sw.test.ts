import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

it('busca a página inicial offline mesmo sem cache da rota ou do portal', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const fallback = new Response('aplicativo offline');
  let response: Promise<Response> | undefined;
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; },
    },
    URL, Response,
    fetch: async () => { throw new Error('offline'); },
    caches: { match: async (key: string) => key === '/' ? fallback : undefined },
  });
  handlers.fetch({
    request: { method: 'GET', url: 'https://example.test/relatorios', mode: 'navigate' },
    respondWith: (value: Promise<Response>) => { response = value; },
  });
  expect(await response).toBe(fallback);
});
