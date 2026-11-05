import { boot, sleep, BASE } from './harness.mjs';
import fsx from 'node:fs';
async function prepFill(page) {
  async function login(nome) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Acesso de demonstração/ }).click(); await sleep(300);
  await page.getByRole('button', { name: new RegExp(nome) }).first().click(); await sleep(1500);
  const encerrar = page.getByRole('button', { name: /Encerrar/ });
  if (await encerrar.count()) { await encerrar.first().click(); await sleep(400); }
}

// S1
await prepFill(page);
await sleep(600);
console.log('--- s1 (preencher)');
await box('uploadCard', page.getByText('Upload do colaborador'));
await box('btnOCR', page.getByRole('button', { name: /Executar OCR/ }));
await box('galeria', page.getByText(/Galeria demonstrativa/));
await page.getByRole('button', { name: /Executar OCR/ }).first().click();
await page.getByText(/OCR concluído/).first().waitFor({ timeout: 60000 }).catch(() => {});
await sleep(600);
await page.getByText('Leitura de identificação').first().scrollIntoViewIfNeeded();
await sleep(600);
console.log('--- s1 (card)');
await box('cardTitle', page.getByText('Leitura de identificação'));
await box('candSA', page.getByText('SA-101').first());
await box('btnConfirmar', page.getByRole('button', { name: /Confirmar selecionado/ }));

// S2
await page.goto(`${BASE}/preencher/${(await import('node:fs')).readFileSync('/tmp/fill-token.txt','utf8').trim()}`, { waitUntil: 'networkidle' });
await sleep(800);
await page.getByRole('button', { name: /^Continuar/ }).click(); await sleep(900);
await page.evaluate(() => { const el=[...document.querySelectorAll('h2,div')].find(n=>/Sugestão padronizada/.test(n.textContent||'')&&n.children.length<3); el?.scrollIntoView({block:'center'}); });
await sleep(700);
console.log('--- s2');
await box('sugestao', page.getByText('Sugestão padronizada'));
await box('textoAtual', page.getByText(/TEXTO ATUAL/));
await box('transf', page.getByText(/Transformações aplicadas/));
await box('btnAceitar', page.getByRole('button', { name: /Aceitar sugestão/ }));

// S3
await login('Marta');
await page.goto(`${BASE}/relatorios/r_143?tab=revisao`, { waitUntil: 'networkidle' });
await sleep(1200);
await page.evaluate(() => { const el=[...document.querySelectorAll('button')].find(b=>/Aprovar relatório/.test(b.textContent||'')); el?.scrollIntoView({block:'center'}); });
await sleep(700);
console.log('--- s3');
await box('checklist', page.getByText('Checklist de revisão'));
await box('btnAprovar', page.getByRole('button', { name: /Aprovar relatório/ }));
await box('comparacao', page.getByText('Comparação de textos'));

// S4
await page.goto(`${BASE}/relatorios/r_143?tab=historico`, { waitUntil: 'networkidle' });
await sleep(1200);
await page.evaluate(() => { const el=[...document.querySelectorAll('h2')].find(h=>/Trilha de auditoria/.test(h.textContent||'')); el?.scrollIntoView({block:'center'}); window.scrollBy(0,-120); });
await sleep(700);
console.log('--- s4');
await box('trilha', page.getByText('Trilha de auditoria'));
await box('primeiroItem', page.getByText(/Relatório aprovado/));

// S5
await page.goto(`${BASE}/relatorios/r_143?tab=documentos`, { waitUntil: 'networkidle' });
await sleep(1400);
console.log('--- s5');
await box('cliente', page.getByText('Relatório para o cliente'));
await box('interno', page.getByText('Relatório interno'));
await box('btnGerar', page.getByRole('button', { name: /Gerar os 2 PDFs/ }));
await page.getByRole('button', { name: /Gerar os 2 PDFs/ }).first().click().catch(() => {});
await sleep(1800);
await box('versoes', page.getByText('Versões arquivadas'));

// S6
await page.goto(`${BASE}/relatorios`, { waitUntil: 'networkidle' });
await sleep(1000);
console.log('--- s6');
await box('search', page.getByPlaceholder(/Buscar código/));
await box('tabela', page.getByText('RELATÓRIO').first());
await box('abrir1', page.getByRole('button', { name: /Abrir/ }));
await page.getByPlaceholder(/Buscar código/).fill('Serra'); await sleep(900);
await box('abrirBusca', page.getByRole('button', { name: /Abrir/ }));

// S7
await page.goto(`${BASE}/relatorios/r_143?tab=texto`, { waitUntil: 'networkidle' });
await sleep(1200);
await page.evaluate(() => { const el=[...document.querySelectorAll('h2')].find(h=>/Comparação de textos/.test(h.textContent||'')); el?.scrollIntoView({block:'center'}); window.scrollBy(0,-100); });
await sleep(700);
console.log('--- s7');
await box('comp', page.getByText('Comparação de textos'));
await box('versoesTexto', page.getByText(/Versões do texto/));
await browser.close();
