import { boot, sleep, BASE } from './harness.mjs';
const t0 = Date.now();
const log = (m) => console.log(((Date.now() - t0) / 1000).toFixed(2), m);
const { browser, context } = await boot({ width: 1600, height: 900, dpr: 1 });
const page = await context.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' }); log('login page');
await page.getByRole('button', { name: /Acesso de demonstração/ }).click(); await sleep(320);
await page.getByRole('button', { name: /Helena/ }).first().click(); await sleep(1500); log('logged');
const encerrar = page.getByRole('button', { name: /Encerrar/ });
if (await encerrar.count()) { await encerrar.first().click(); await sleep(500); }
await page.goto(`${BASE}/relatorios`, { waitUntil: 'networkidle' }); await sleep(1200); log('relatorios');
const search = page.getByPlaceholder(/Buscar código, cliente, equipamento/);
log('search count ' + await search.count());
await search.click(); log('clicked');
for (const ch of 'Serra Azul') { await page.keyboard.type(ch); await sleep(140); }
log('typed');
const chips = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => /Aprovados|Todos|Correção/.test(b.textContent || '')).map(b => ({ t: b.textContent?.trim(), r: b.getBoundingClientRect().toJSON() })));
log('chips ' + JSON.stringify(chips));
const apro = page.getByRole('button', { name: /^Aprovados$/ }).first();
log('aprovados count ' + await apro.count());
await apro.click().catch(e => log('click err ' + e.message.slice(0, 80)));
await sleep(1200);
log('after chip');
await page.screenshot({ path: 'out/dbg6.png' });
await browser.close();
