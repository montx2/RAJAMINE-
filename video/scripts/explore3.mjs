import { boot, sleep, BASE } from './harness.mjs';
import fs from 'node:fs';

const { browser, context, width, height } = await boot({ width: 2560, height: 1440 });
const page = await context.newPage();

// login Helena
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Helena/ }).first().click();
await page.waitForTimeout(1600);
const encerrar = page.getByRole('button', { name: /Encerrar/ });
if (await encerrar.count()) await encerrar.first().click();
await page.waitForTimeout(500);

// descobre ids de relatórios
const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href^="/relatorios/"]')].map((a) => a.getAttribute('href')));
console.log('hrefs', hrefs.slice(0, 5));
await page.goto(`${BASE}/relatorios`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const links = await page.evaluate(() => [...document.querySelectorAll('a[href*="/relatorios/REL"]')].map((a) => a.getAttribute('href')));
console.log('links', links);
await page.screenshot({ path: 'out/e-relatorios-2560.png' });

// abre um relatório em revisão
const emRevisao = page.getByRole('row').filter({ hasText: /Em revisão/ }).first();
await emRevisao.getByRole('button', { name: /Abrir/ }).click().catch(async () => { await emRevisao.click(); });
await page.waitForTimeout(1500);
console.log('url', page.url());
await page.screenshot({ path: 'out/e-detalhe.png', fullPage: false });
const tabs = await page.evaluate(() => [...document.querySelectorAll('[role="tab"], button')].map((b) => b.textContent?.trim()).filter((t) => t && t.length < 30));
console.log('tabs', [...new Set(tabs)].slice(0, 20));

await browser.close();
