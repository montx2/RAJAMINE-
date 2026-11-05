import { chromium as pw } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
const exe = await sparticuz.executablePath();
const args = sparticuz.args.filter((a) => !a.startsWith('--single-process'));
async function run(name, width, height, dsf) {
  const b = await pw.launch({ executablePath: exe, headless: true, args: [...args, '--font-render-hinting=none', '--disable-lcd-text'] });
  const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: dsf, recordVideo: { dir: `out/vid-${name}`, size: { width, height } } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Acesso de demonstração/ }).click();
  await p.getByRole('button', { name: /Helena/ }).first().click();
  await p.waitForTimeout(1500);
  const t0 = Date.now();
  // movimento contínuo: scroll suave
  await p.evaluate(async () => {
    for (let i = 0; i < 60; i++) { window.scrollBy(0, 12); await new Promise((r) => setTimeout(r, 60)); }
  });
  const t1 = Date.now();
  const v = p.video();
  await ctx.close();
  await b.close();
  console.log(name, 'recorded', t1 - t0, 'ms ->', v ? await v.path() : 'none');
}
await run('a', 2560, 1440, 1);
await run('b', 1920, 1080, 2);
