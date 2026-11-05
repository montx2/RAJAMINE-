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

// rAF fps sem screencast durante zoom
const riff = async () => {
  await page.evaluate(() => { window.__f = 0; const step = () => { window.__f++; window.__raf = requestAnimationFrame(step); }; window.__raf = requestAnimationFrame(step); });
  await page.evaluate(() => { const r = document.getElementById('root'); r.style.transition = 'transform 2000ms linear'; r.style.transformOrigin = '600px 300px'; r.style.transform = 'scale(1.7)'; });
  await sleep(2100);
  const f = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__f; });
  await page.evaluate(() => { const r = document.getElementById('root'); r.style.transition = ''; r.style.transform = 'scale(1)'; });
  await sleep(500);
  console.log('rAF fps (sem screencast):', (f / 2.1).toFixed(1));
};
await riff();

// screencast + rAF simultâneo
const cdp = await page.context().newCDPSession(page);
let n = 0; const ts = [];
cdp.on('Page.screencastFrame', (f) => { n++; ts.push(f.metadata.timestamp); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Page.enable');
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
await sleep(500);
await page.evaluate(() => { window.__f = 0; const step = () => { window.__f++; window.__raf = requestAnimationFrame(step); }; window.__raf = requestAnimationFrame(step); });
await page.evaluate(() => { const r = document.getElementById('root'); r.style.transition = 'transform 2000ms linear'; r.style.transformOrigin = '600px 300px'; r.style.transform = 'scale(1.6)'; });
await sleep(2100);
const f2 = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__f; });
const dur = ts.length > 1 ? ts.at(-1) - ts[0] : 1;
console.log('com screencast: frames', n, 'dur', dur.toFixed(2), 'fps cap', (n / dur).toFixed(1), '| rAF fps', (f2 / 2.1).toFixed(1));
await cdp.send('Page.stopScreencast').catch(() => {});
await browser.close();
