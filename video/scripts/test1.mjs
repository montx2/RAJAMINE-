import { boot, injectTools, Shot, cursorTo, clickEl, smoothScroll, focusEl, caption, showCard, chapterCard, sleep, BASE } from './harness.mjs';
import { loadShot, shotFromFrames } from './encode.mjs';

const { browser, context, width, height } = await boot();
const page = await context.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Helena/ }).first().click();
await page.waitForTimeout(1500);
// fecha tour
const encerrar = page.getByRole('button', { name: /Encerrar/ });
if (await encerrar.count()) await encerrar.first().click();
await page.waitForTimeout(600);
await page.goto(`${BASE}/documentos`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await injectTools(page);

const shot = new Shot(page, 'test1', { width, height });
await shot.begin();
const t = shot.mark();
await caption(page, 'OCR · LEITURA AUTOMÁTICA', 'Reconhecimento de número de série e IMEI');
await sleep(900);
await focusEl(page, 'table tbody tr:nth-child(1)', 1.55);
await sleep(1200);
await clickEl(page, page.getByRole('button', { name: /Visualizar/ }).first());
await sleep(1500);
await page.evaluate(() => window.__d.reset());
await sleep(800);
await caption(page, '', '');
await smoothScroll(page, 400, 900);
await sleep(1200);
await shot.end();
console.log('recorded', shot.frames.length, 'frames', ((Date.now() / 1000) - t).toFixed(1), 's');
const { frames, info } = loadShot('test1');
console.log('info', info);
shotFromFrames({ frames, info, from: info.mark, to: info.mark + 8, duration: 8, out: 'out/test1.mp4' });
await browser.close();
