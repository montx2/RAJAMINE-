import { boot, sleep, BASE } from './harness.mjs';
const { browser, context } = await boot({ width: 1600, height: 900, dpr: 1 });
const page = await context.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click(); await sleep(300);
await page.getByRole('button', { name: /Helena/ }).first().click(); await sleep(1400);
const encerrar = page.getByRole('button', { name: /Encerrar/ });
if (await encerrar.count()) { await encerrar.first().click(); await sleep(400); }
await page.goto(`${BASE}/relatorios`, { waitUntil: 'networkidle' }); await sleep(900);
const search = page.getByPlaceholder(/Buscar código/);
for (const q of ['Serra', 'Mineradora', '0143', 'C-101', 'Serra Azul', 'Meta']) {
  await search.fill(q); await sleep(600);
  const n = await page.getByText(/resultado/).first().textContent().catch(() => '?');
  console.log(JSON.stringify(q), '->', n);
}
await search.fill('Serra'); await sleep(500);
await page.getByRole('button', { name: /^Aprovados$/ }).first().click(); await sleep(700);
console.log('aprovados+Serra:', await page.getByText(/resultado/).first().textContent().catch(() => '?'));
await search.fill('Serra Azul'); await sleep(600);
console.log('aprovados+SerraAzul:', await page.getByText(/resultado/).first().textContent().catch(() => '?'));
await page.screenshot({ path: 'out/dbg7.png' });
await browser.close();
