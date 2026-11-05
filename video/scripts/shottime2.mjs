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
const cdp = await context.newCDPSession(page);
async function bench(label, n = 15) {
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate((v) => { document.getElementById('root').style.transform = `scale(${v})`; }, 1 + i * 0.001);
    await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 82, optimizeForSpeed: true, captureBeyondViewport: false });
  }
  const dt = Date.now() - t0;
  console.log(label, (dt / n).toFixed(0), 'ms/frame', (1000 * n / dt).toFixed(1), 'fps');
}
await page.evaluate(() => { const r = document.getElementById('root'); r.style.transition = 'none'; r.style.transformOrigin = '600px 300px'; });
await bench('cdp-zoom1');
await page.evaluate(() => { document.getElementById('root').style.transform = 'scale(1.5)'; });
await sleep(500);
await bench('cdp-zoom1.5');
await page.evaluate(() => { document.getElementById('root').style.transform = 'scale(1)'; });
await sleep(300);
const t0 = Date.now();
for (let i = 0; i < 15; i++) { await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 82, optimizeForSpeed: true, captureBeyondViewport: false }); }
console.log('cdp-estatico', ((Date.now() - t0) / 15).toFixed(0), 'ms/frame', (15000 / (Date.now() - t0)).toFixed(1), 'fps');
await browser.close();
