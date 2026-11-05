import { launch } from './lib.mjs';

const { browser, context } = await launch({ width: 1600, height: 900 });
const page = await context.newPage();
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: /Link individual do colaborador/ }).click();
await page.waitForTimeout(1500);
console.log('url', page.url());
await page.waitForTimeout(800);
await page.screenshot({ path: 'out/y-fill-0.png' });
await page.getByRole('button', { name: /Continuar/ }).click();
await page.waitForTimeout(600);
await page.getByLabel('Descrição das atividades').fill(
  'Foi realizado instalação do equipamento SA-101 com telemetria numero 0187 e tablet pulsus 2741. Também foi instalado camera de fadiga, o imei e 864993060408250. Verificamos o funcionamento e o cliente aprovou o servico no local.',
);
await page.waitForTimeout(1200);
await page.screenshot({ path: 'out/y-fill-1.png', fullPage: false });
const padro = await page.locator('text=PADRONIZAÇÃO').first().count();
console.log('padro count', padro);
await page.screenshot({ path: 'out/y-fill-1-full.png', fullPage: true });
await page.getByRole('button', { name: /Continuar/ }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'out/y-fill-2.png' });

// anexa duas fotos demo
const thumbs = page.locator('#demo-photo button');
console.log('thumbs', await thumbs.count());
await thumbs.nth(6).click();
await page.getByRole('button', { name: /Anexar selecionada/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'out/y-fill-2b.png' });

// roda OCR na primeira foto
const t0 = Date.now();
await page.getByRole('button', { name: /Executar OCR/ }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'out/y-fill-ocr-progress.png' });
try {
  await page.locator('text=/OCR concluído|SIMULADO/').first().waitFor({ timeout: 180000 });
} catch (e) { console.log('ocr wait timeout'); }
console.log('ocr ms', Date.now() - t0);
await page.waitForTimeout(1200);
await page.screenshot({ path: 'out/y-fill-ocr-done.png', fullPage: true });
await browser.close();
