/* Gera o pacote pendrive: build + copia dist para portable/app.
   Uso: node scripts/make-portable.mjs
   Requer Node apenas na máquina de desenvolvimento, não no SENAI. */
import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
const app = resolve(root, 'portable', 'app');

execSync('npm run build', { cwd: root, stdio: 'inherit' });
if (!existsSync(dist)) throw new Error('dist não encontrado após build');
mkdirSync(app, { recursive: true });
rmSync(app, { recursive: true, force: true });
cpSync(dist, app, { recursive: true });
console.log('Pacote pronto em portable/. Execute portable/INICIAR.bat no Windows.');
