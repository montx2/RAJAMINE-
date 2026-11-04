/**
 * Prepara os assets locais do Tesseract.js (OCR real no navegador, sem CDN).
 * - worker.min.js  → node_modules/tesseract.js/dist
 * - core WASM      → node_modules/tesseract.js-core
 * - eng.traineddata.gz → github.com/tesseract-ocr/tessdata_fast (Apache-2.0)
 *
 * Executar: npm run setup:ocr
 * Os arquivos são servidos de /public/ocr e NÃO são versionados (.gitignore).
 */
import { cpSync, mkdirSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'ocr');
mkdirSync(join(out, 'core'), { recursive: true });
mkdirSync(join(out, 'lang'), { recursive: true });

// 1. Worker
const workerSrc = join(root, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js');
if (!existsSync(workerSrc)) {
  console.error('worker.min.js não encontrado. Rode `npm install` primeiro.');
  process.exit(1);
}
cpSync(workerSrc, join(out, 'worker.min.js'));
console.log('✓ worker.min.js');

// 2. Core WASM (todas as variantes; o loader escolhe conforme o navegador)
const coreDir = join(root, 'node_modules', 'tesseract.js-core');
let n = 0;
for (const f of readdirSync(coreDir)) {
  if (f.endsWith('.wasm') || f.endsWith('.wasm.js')) {
    cpSync(join(coreDir, f), join(out, 'core', f));
    n++;
  }
}
console.log(`✓ core WASM (${n} arquivos)`);

// 3. Modelo de idioma (inglês — dígitos e caracteres latinos; ~4 MB)
// tessdata_fast distribui .traineddata sem compressão; compactamos com gzip.
const langFile = join(out, 'lang', 'eng.traineddata.gz');
if (!existsSync(langFile)) {
  console.log('Baixando eng.traineddata (tessdata_fast, Apache-2.0)…');
  const { execSync } = await import('node:child_process');
  const tmp = join(out, 'lang', 'eng.traineddata');
  try {
    // Via API de blobs do GitHub (funciona em sandboxes com hosts restritos)
    const meta = JSON.parse(execSync(`curl -s "https://api.github.com/repos/tesseract-ocr/tessdata_fast/contents/eng.traineddata"`).toString());
    execSync(`curl -s "https://api.github.com/repos/tesseract-ocr/tessdata_fast/git/blobs/${meta.sha}" -H "Accept: application/vnd.github.raw" -o "${tmp}"`);
    execSync(`gzip -c "${tmp}" > "${langFile}"`);
    execSync(`rm "${tmp}"`);
  } catch {
    console.error('Falha ao baixar modelo. O OCR usará o modo demonstrativo.');
    process.exit(0);
  }
}
console.log('✓ eng.traineddata.gz');
console.log('OCR local pronto.');
