import { boot, injectTools, sleep, BASE } from './harness.mjs';
import fs from 'node:fs';

const { browser, context, width, height } = await boot();
const page = await context.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Helena/ }).first().click();
await page.waitForTimeout(1500);
await page.goto(`${BASE}/documentos`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await injectTools(page);

for (const cfg of [
  { name: 'q88-ackwait', quality: 88, w: 1920, h: 1080, ackWait: true },
  { name: 'q72-noack', quality: 72, w: 1920, h: 1080, ackWait: false },
  { name: 'q60-1280-noack', quality: 60, w: 1280, h: 720, ackWait: false },
]) {
  const cdp = await page.context().newCDPSession(page);
  let n = 0; const ts = [];
  cdp.on('Page.screencastFrame', (f) => {
    n++; ts.push(f.metadata.timestamp);
    if (cfg.ackWait) cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    else cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.enable');
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: cfg.quality, maxWidth: cfg.w, maxHeight: cfg.h, everyNthFrame: 1 });
  // animação contínua: zoom + scroll
  await page.evaluate(() => { const r = document.getElementById('root'); r.style.transition = 'transform 3000ms linear'; r.style.transformOrigin = '600px 300px'; r.style.transform = 'scale(1.7)'; });
  await sleep(1500);
  await page.evaluate(() => { const r = document.getElementById('root'); r.style.transform = 'scale(1.05)'; });
  await sleep(1500);
  await page.evaluate(() => { document.getElementById('root').style.transform = 'scale(1.5)'; });
  await sleep(2000);
  const dur = ts.length > 1 ? ts.at(-1) - ts[0] : 1;
  console.log(cfg.name, 'frames', n, 'dur', dur.toFixed(2), 'fps', (n / dur).toFixed(1));
  await cdp.send('Page.stopScreencast').catch(() => {});
  await page.evaluate(() => { const r = document.getElementById('root'); r.style.transition = ''; r.style.transform = 'scale(1)'; });
  await sleep(300);
}
await browser.close();
