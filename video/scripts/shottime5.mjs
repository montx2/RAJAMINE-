import { boot, sleep, BASE } from './harness.mjs';
const { browser, context } = await boot({ width: 1280, height: 720 });
const page = await context.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Helena/ }).first().click();
await page.waitForTimeout(1600);
await page.goto(`${BASE}/relatorios/r_143`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
for (const [label, opts] of [['pw-jpeg', { type: 'jpeg', quality: 92 }], ['pw-png', { type: 'png' }]]) {
  const t0 = Date.now();
  for (let i = 0; i < 10; i++) await page.screenshot({ ...opts, path: `/tmp/pw-${label}-${i}.jpg` });
  console.log(label, ((Date.now() - t0) / 10).toFixed(0), 'ms/frame');
}
const cdp = await context.newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 2, mobile: false });
const t1 = Date.now();
for (let i = 0; i < 10; i++) await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
console.log('cdp-after-override', ((Date.now() - t1) / 10).toFixed(0), 'ms/frame');
await browser.close();
