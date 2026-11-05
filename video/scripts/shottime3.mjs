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
const bench = async (label, n = 12) => {
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate((v) => { document.getElementById('root').style.transform = `scale(${v})`; }, 1.2 + i * 0.01);
    await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 82, optimizeForSpeed: true });
  }
  const dt = Date.now() - t0;
  console.log(label, (dt / n).toFixed(0), 'ms', (1000 * n / dt).toFixed(1), 'fps');
};
await page.evaluate(() => {
  const r = document.getElementById('root'); r.style.transition = 'none'; r.style.transformOrigin = '600px 300px';
  const s = document.createElement('style'); s.textContent = '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'; document.head.appendChild(s);
});
await sleep(400);
await bench('sem-blur');
await page.evaluate(() => { const r = document.getElementById('root'); r.style.willChange = 'transform'; });
await sleep(300);
await bench('sem-blur+willchange');
// amostra visual nítida?
await page.evaluate(() => { document.getElementById('root').style.transform = 'scale(1.6)'; });
await sleep(700);
await page.screenshot({ path: 'out/sharp-test.png' });
await browser.close();
