import { boot, injectTools, sleep, BASE } from './harness.mjs';
const { browser, context } = await boot();
const page = await context.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Helena/ }).first().click();
await page.waitForTimeout(1500);
await page.goto(`${BASE}/documentos`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await injectTools(page);
await page.evaluate(() => { const r = document.getElementById('root'); r.style.transition = 'none'; r.style.transformOrigin = '600px 300px'; r.style.transform = 'scale(1.4)'; });
await sleep(400);
for (const [label, opts] of [['jpeg85', { type: 'jpeg', quality: 85 }], ['png', { type: 'png' }]]) {
  const t0 = Date.now();
  for (let i = 0; i < 20; i++) {
    await page.evaluate((v) => { document.getElementById('root').style.transform = `scale(${1.4 + v * 0.002})`; }, i);
    await page.screenshot({ path: `/tmp/f-${label}-${i}.jpg`, ...opts });
  }
  const dt = Date.now() - t0;
  console.log(label, 'per frame ms', (dt / 20).toFixed(1), 'fps', (20000 / dt).toFixed(1));
}
await browser.close();
