import { launch } from './lib.mjs';
const { browser, context } = await launch({ width: 1400, height: 900 });
const page = await context.newPage();
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
console.log(await page.evaluate(() => Object.keys(localStorage)));
const raw = await page.evaluate(() => localStorage.getItem('safip-fieldops-v2'));
console.log('len', raw && raw.length);
await browser.close();
