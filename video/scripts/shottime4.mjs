import { chromium as pw } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
const exe = await sparticuz.executablePath();
const args = [...sparticuz.args.filter((a) => !a.startsWith('--single-process')), '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'];
const b = await pw.launch({ executablePath: exe, headless: true, args });
for (const [w, h, dsf] of [[1280, 720, 2], [1600, 900, 1.5], [1920, 1080, 1]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, locale: 'pt-BR' });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Acesso de demonstração/ }).click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /Helena/ }).first().click();
  await p.waitForTimeout(1600);
  await p.goto('http://localhost:5173/relatorios/r_143', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const cdp = await ctx.newCDPSession(p);
  const t0 = Date.now();
  for (let i = 0; i < 10; i++) await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, optimizeForSpeed: true });
  console.log(`${w}x${h} dsf${dsf}`, ((Date.now() - t0) / 10).toFixed(0), 'ms/frame');
  await p.screenshot({ path: `out/dens-${w}x${h}@${dsf}.png` });
  await ctx.close();
}
await b.close();
