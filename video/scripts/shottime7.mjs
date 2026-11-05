import { chromium as pw } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
import fsx from 'node:fs';
const exe = await sparticuz.executablePath();
const args = [...sparticuz.args.filter((a) => !a.startsWith('--single-process')), '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'];
const b = await pw.launch({ executablePath: exe, headless: true, args });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, locale: 'pt-BR' });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Helena/ }).first().click();
await page.waitForTimeout(1600);
await page.goto('http://localhost:5173/relatorios/r_143', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const cdp = await ctx.newCDPSession(page);
let t0 = Date.now();
for (let i = 0; i < 8; i++) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1280, height: 720, scale: 2 }, captureBeyondViewport: false });
  if (i === 0) { const buf = Buffer.from(r.data, 'base64'); fsx.writeFileSync('/tmp/clip.png', buf); }
}
console.log('clip-scale2 png', ((Date.now() - t0) / 8).toFixed(0), 'ms');
t0 = Date.now();
for (let i = 0; i < 8; i++) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 2 }, captureBeyondViewport: false });
  if (i === 0) { const buf = Buffer.from(r.data, 'base64'); fsx.writeFileSync('/tmp/clip.jpg', buf); }
}
console.log('clip-scale2 jpeg', ((Date.now() - t0) / 8).toFixed(0), 'ms');
await b.close();
