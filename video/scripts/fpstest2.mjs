import { boot, injectTools, sleep, BASE } from './harness.mjs';

async function measure(page, label, { w = 1920, h = 1080, quality = 85, prep } = {}) {
  if (prep) await page.evaluate(prep);
  const cdp = await page.context().newCDPSession(page);
  let n = 0; const ts = [];
  cdp.on('Page.screencastFrame', (f) => { n++; ts.push(f.metadata.timestamp); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.enable');
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality, maxWidth: w, maxHeight: h, everyNthFrame: 1 });
  await sleep(300);
  const t0 = Date.now();
  // animação de zoom contínua por 3s
  await page.evaluate(() => {
    const r = document.getElementById('root');
    r.style.transition = 'transform 3200ms linear'; r.style.transformOrigin = '600px 300px';
    r.style.transform = 'scale(1.7)';
  });
  await sleep(1800);
  await page.evaluate(() => { document.getElementById('root').style.transform = 'scale(1.02)'; });
  await sleep(1800);
  const dur = ts.length > 1 ? ts.at(-1) - ts[0] : 1;
  console.log(label, 'frames', n, 'dur', dur.toFixed(2), 'fps', (n / dur).toFixed(1));
  await cdp.send('Page.stopScreencast').catch(() => {});
  await page.evaluate(() => { const r = document.getElementById('root'); r.style.transition = ''; r.style.transform = 'scale(1)'; });
  await sleep(500);
}

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

await measure(page, 'base-1080');
await measure(page, 'noblur-1080', { prep: () => { const s = document.createElement('style'); s.textContent = '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'; document.head.appendChild(s); } });
await measure(page, 'noblur-720', { w: 1280, h: 720 });
await browser.close();
