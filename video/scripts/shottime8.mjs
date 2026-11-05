import { chromium as pw } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
import fs from 'node:fs';
const exe = await sparticuz.executablePath();
const args = [...sparticuz.args.filter((a) => !a.startsWith('--single-process')), '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'];
const b = await pw.launch({ executablePath: exe, headless: true, args });
for (const [w, h] of [[1280, 720], [1280, 720], [1600, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: 'pt-BR' });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Helena/ }).first().click();
  await page.waitForTimeout(1500);
  await page.goto('http://localhost:5173/relatorios/r_143?tab=revisao', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page);
  const t0 = Date.now();
  for (let i = 0; i < 10; i++) {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    if (i === 0) fs.writeFileSync(`/tmp/cap-${w}.png`, Buffer.from(r.data, 'base64'));
  }
  console.log(`${w}x${h}`, ((Date.now() - t0) / 10).toFixed(0), 'ms/frame', (10000 / (Date.now() - t0)).toFixed(1), 'fps');
  await ctx.close();
}
await b.close();
