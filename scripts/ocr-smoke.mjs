/**
 * Verificação de qualidade do OCR real (Tesseract) nas fotos demonstrativas.
 * Executa em Node com o MESMO modelo local usado pelo navegador.
 * Uso: node scripts/ocr-smoke.mjs
 */
import { createWorker } from 'tesseract.js';
import { mkdirSync } from 'node:fs';

mkdirSync('./node_modules/.cache/tesseract', { recursive: true });
const worker = await createWorker('eng', 1, {
  langPath: './public/ocr/lang',
  gzip: true,
  cachePath: './node_modules/.cache/tesseract',
});
await worker.setParameters({ tessedit_pageseg_mode: '11' });

for (const f of ['foto-eq2041.jpg', 'foto-eq1087.jpg', 'foto-eq3315.jpg']) {
  const t0 = Date.now();
  const { data } = await worker.recognize(`./public/demo/${f}`);
  const text = data.text.trim().replace(/\n+/g, ' | ');
  console.log(`${f}: conf=${Math.round(data.confidence)}% (${((Date.now() - t0) / 1000).toFixed(1)}s) → "${text.slice(0, 140)}"`);
}
await worker.terminate();
