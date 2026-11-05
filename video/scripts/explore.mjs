import { launch } from './lib.mjs';
const { browser, context } = await launch({ width: 1600, height: 900 });
const page = await context.newPage();
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'out/x-login.png' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: 'out/x-login-demo.png' });
await page.getByRole('button', { name: /Helena/ }).first().click();
await page.waitForTimeout(1800);
for (const [name, path] of [['dashboard','/'],['relatorios','/relatorios'],['revisao','/revisao'],['documentos','/documentos'],['operacoes','/operacoes'],['equipamentos','/equipamentos']]) {
  await page.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `out/x-${name}.png` });
  const t = await page.title();
  console.log(name, '->', t);
}
await browser.close();
