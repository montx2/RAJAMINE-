/**
 * Gravação das tomadas. Cada "shot" = uma tomada contínua capturada frame a frame
 * (CDP Page.captureScreenshot) em 2560x1440 (viewport 1280x720 @2x).
 * A câmera (zoom/pan), o cursor, os cliques e as legendas são reconstruídos no
 * build a partir das marcações de tempo — por isso ficam perfeitamente suaves.
 */
import { boot, sleep, BASE } from './harness.mjs';
import fs from 'node:fs';
import path from 'node:path';

const DPR = 1; // frames = pixels CSS (1600x900), reescalados no build
const VW = 1600;
const VH = 900;
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const OUT = '/tmp/shots';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync('/tmp/frames', { recursive: true });

const now = () => Date.now() / 1000;

class Rec {
  constructor(page, name) {
    this.page = page;
    this.name = name;
    this.dir = `/tmp/frames/${name}`;
    this.frames = [];
    this.cursor = [];
    this.clicks = [];
    this.cam = [];
  }

  async start() {
    fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
    this.cdp = await this.page.context().newCDPSession(this.page);
    // aquecimento: as primeiras capturas após carregar a página podem levar segundos;
    // só começa a contar o tempo quando o compositor já responde rápido
    for (let k = 0; k < 24; k++) {
      const t = Date.now();
      await this.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true }).catch(() => {});
      if (Date.now() - t < 260) break;
      await sleep(120);
    }
    this.t0 = now();
    this.cam.push({ t: 0, x: VW / 2, y: VH / 2, z: 1 });
    this.cursor.push({ t: 0, x: VW - 90, y: VH - 120 });
    this.running = true;
    this.loopP = this.loop();
    await sleep(120);
  }

  async loop() {
    let i = 0;
    while (this.running) {
      const t = now() - this.t0;
      let buf;
      try {
        const res = await this.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
        buf = Buffer.from(res.data, 'base64');
      } catch (e) {
        this.errors = (this.errors || 0) + 1;
        console.log('    capture error:', String(e).slice(0, 120));
        if (this.errors > 40) break;
        await sleep(60);
        continue;
      }
      fs.writeFileSync(path.join(this.dir, `${String(i).padStart(5, '0')}.png`), buf);
      this.frames.push(t);
      i++;
      await sleep(8);
    }
  }

  async stop() {
    this.running = false;
    await this.loopP;
    const dur = this.frames.at(-1) ?? 0;
    const data = { name: this.name, duration: +dur.toFixed(3), frames: this.frames, cursor: this.cursor, clicks: this.clicks, cam: this.cam };
    fs.writeFileSync(path.join(OUT, `${this.name}.json`), JSON.stringify(data));
    console.log(`  ${this.name}: ${this.frames.length} frames / ${dur.toFixed(2)}s (${(this.frames.length / dur).toFixed(1)} fps)`);
  }

  t() { return now() - this.t0; }

  /* câmera: centro (px do frame) + zoom, alcançado em durMs */
  camTo(x, y, z, durMs = 1000) {
    const w = VW / z;
    const h = VH / z;
    const cx = Math.min(Math.max(x, w / 2), VW - w / 2);
    const cy = Math.min(Math.max(y, h / 2), VH - h / 2);
    this.cam.push({ t: this.t() + durMs / 1000, x: +cx.toFixed(1), y: +cy.toFixed(1), z });
  }

  async centerOf(target) {
    let loc = null;
    if (typeof target === 'string') loc = this.page.locator(target).first();
    else if (target && typeof target.boundingBox === 'function') loc = target.first ? target.first() : target;
    const box = loc ? await loc.boundingBox() : target;
    if (!box) return null;
    const cx = Math.min(Math.max(box.x + box.width / 2, box.width / 2 + 1), VW - box.width / 2 - 1);
    const cy = Math.min(Math.max(box.y + box.height / 2, box.height / 2 + 1), VH - box.height / 2 - 1);
    return { x: cx, y: cy, box };
  }

  async camEl(target, z, durMs = 1000) {
    const c = await this.centerOf(target);
    if (c) this.camTo(c.x, c.y, z, durMs);
  }

  /* cursor: move o mouse real (para hover/foco) e grava os keyframes */
  async moveTo(target, ms = 620) {
    const loc = typeof target === 'string' ? this.page.locator(target).first()
      : (target && target.first ? target.first() : target);
    if (loc && typeof loc.scrollIntoViewIfNeeded === 'function') {
      await loc.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
      await sleep(180);
    }
    const c = await this.centerOf(loc && typeof loc.boundingBox === 'function' ? loc : target);
    if (!c) return null;
    const from = this.cursor.at(-1);
    const x2 = c.x;
    const y2 = c.y;
    const tStart = this.t();
    const steps = Math.max(8, Math.round(ms / 22));
    const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
    for (let i = 1; i <= steps; i++) {
      const u = ease(i / steps);
      await this.page.mouse.move(from.x + (x2 - from.x) * u, from.y + (y2 - from.y) * u);
      await sleep(ms / steps);
    }
    this.cursor.push({ t: tStart, x: from.x, y: from.y });
    this.cursor.push({ t: tStart + ms / 1000, x: x2, y: y2 });
    return c;
  }

  async click(target, { ms = 620, hold = 140 } = {}) {
    const c = await this.moveTo(target, ms);
    if (!c) throw new Error('alvo do clique não encontrado');
    await sleep(hold);
    const box = c.box;
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
    await sleep(55);
    await this.page.mouse.up();
    this.clicks.push({ t: this.t(), x: c.x, y: c.y });
    return c;
  }

  async type(target, text, cps = 9) {
    const el = typeof target === 'string' ? this.page.locator(target).first() : target;
    await el.click();
    for (const ch of text) {
      await this.page.keyboard.type(ch);
      await sleep(1000 / cps);
    }
  }

  /* rolagem suave (a câmera acompanha pelo enquadramento escolhido) */
  async scroll(dy, ms = 900) {
    const steps = Math.max(12, Math.round(ms / 24));
    for (let i = 0; i < steps; i++) {
      await this.page.evaluate((v) => window.scrollBy(0, v), dy / steps);
      await sleep(ms / steps);
    }
  }
}

/* ─────────────────────────── preparação ─────────────────────────── */
async function login(page, nome) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const demo = page.getByRole('button', { name: /Acesso de demonstração/ });
  if (!(await demo.count().catch(() => 0))) return; // sessão já ativa
  await demo.click();
  await sleep(320);
  await page.getByRole('button', { name: new RegExp(nome) }).first().click();
  await sleep(1500);
  const encerrar = page.getByRole('button', { name: /Encerrar/ });
  if (await encerrar.count()) { await encerrar.first().click(); await sleep(500); }
  // o tour de introdução abre na primeira visita a um relatório: fecha antes de gravar
  await page.goto(`${BASE}/relatorios/r_143`, { waitUntil: 'networkidle' });
  await sleep(900);
  const tour = page.getByRole('button', { name: /Encerrar|Começar|Entendi|Pular/ });
  if (await tour.count().catch(() => 0)) { await tour.first().click(); await sleep(400); }
}

const token = () => fs.readFileSync('/tmp/fill-token.txt', 'utf8').trim();

/* abre o link individual de preenchimento e chega no passo de fotos com 1 etiqueta anexada */
async function prepFill(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Acesso de demonstração/ }).click();
  await sleep(300);
  await page.getByRole('button', { name: /Link individual do colaborador/ }).click();
  await sleep(1400);
  fs.writeFileSync('/tmp/fill-token.txt', page.url().split('/preencher/')[1]);
  const encerrar = page.getByRole('button', { name: /Encerrar/ });
  if (await encerrar.count()) { await encerrar.first().click(); await sleep(400); }
  await page.getByRole('button', { name: /^Continuar/ }).click();
  await sleep(400);
  await page.getByLabel('Descrição das atividades').fill(
    'Cheguei ao pátio da mina às 7h e fui recebido pelo supervisor. Instalei o módulo de telemetria no caminhão, conferi os chicotes e testei a comunicação. Também fixei a câmera de fadiga e validei o sinal do tablet. Terminei o serviço às 15h e entreguei o checklist para o motorista.',
  );
  await sleep(900);
  await page.getByRole('button', { name: /^Continuar/ }).click();
  await sleep(700);
  await page.setInputFiles('input[type=file]', ['assets/etiqueta-sa101.jpg']);
  await sleep(1500);
}

/* ─────────────────────────── tomadas ─────────────────────────── */

/* mede caixas durante o setup (não entra no vídeo) */
async function measure(...pairs) {
  const out = {};
  for (const [key, loc] of pairs) {
    out[key] = await loc.first().boundingBox({ timeout: 1500 }).catch(() => null);
  }
  return out;
}

/* centraliza a câmera numa caixa já medida */
function camBox(rec, b, { pad = 120, dx = 0, dy = 0, maxZ = 1.6, minZ = 1.2, dur = 1300 } = {}) {
  if (!b) return null;
  const zx = VW / (b.width + pad * 2);
  const zy = VH / (b.height + pad * 2);
  const z = Math.min(maxZ, Math.max(minZ, Math.min(zx, zy)));
  const x = b.x + b.width / 2 + dx;
  const y = b.y + b.height / 2 + dy;
  rec.camTo(x, y, z, dur);
  return { x, y, z };
}

/* enquadra um elemento: zoom que cabe o elemento + respiro, centralizado nele */
async function frameEl(rec, target, { pad = 200, dur = 1300, minZ = 1.2, maxZ = 1.6, dx = 0, dy = 0 } = {}) {
  const b = await target.first().boundingBox({ timeout: 900 }).catch(() => null);
  if (!b) return null;
  const zx = VW / (b.width + pad * 2);
  const zy = VH / (b.height + pad * 2);
  const z = Math.min(maxZ, Math.max(minZ, Math.min(zx, zy)));
  const x = b.x + b.width / 2 + dx;
  const y = b.y + b.height / 2 + dy;
  await rec.camTo(x, y, z, dur);
  return { b, x, y, z };
}

/* enquadra o intervalo entre dois elementos (ex.: as duas colunas de comparação) */
async function frameSpan(rec, a, b, { pad = 50, dur = 1300, minZ = 1.2, maxZ = 1.55, dx = 0, dy = 0 } = {}) {
  const ba = await a.first().boundingBox({ timeout: 900 }).catch(() => null);
  const bb = await b.first().boundingBox({ timeout: 900 }).catch(() => null);
  if (!ba || !bb) return frameEl(rec, a, { pad: 240, dur, maxZ, dx, dy });
  const x0 = Math.min(ba.x, bb.x);
  const x1 = Math.max(ba.x + ba.width, bb.x + bb.width);
  const y0 = Math.min(ba.y, bb.y);
  const y1 = Math.max(ba.y + ba.height, bb.y + bb.height);
  const z = Math.min(maxZ, Math.max(minZ, Math.min(VW / (x1 - x0 + pad * 2), VH / (y1 - y0 + pad * 2))));
  const x = (x0 + x1) / 2 + dx;
  const y = (y0 + y1) / 2 + dy;
  await rec.camTo(x, y, z, dur);
  return { x, y, z };
}

const SHOTS = [
  {
    name: 's1_ocr',
    async setup(page) {
      await prepFill(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(300);
    },
    async run(rec, page) {
      const btn = page.getByRole('button', { name: /Executar OCR/ }).first();
      await sleep(450);
      await rec.camTo(700, 430, 1.18, 900);
      await frameEl(rec, page.getByText('Upload do colaborador'), { pad: 170, maxZ: 1.4, dur: 1200, dy: -40 });
      await sleep(500);
      await rec.click(btn, { ms: 620 });
      await sleep(400);
      const st = await frameEl(rec, page.getByText(/Pré-processando OCR|Reconhecendo texto|Processando/).first(), { pad: 260, maxZ: 1.5, dur: 1000 });
      if (!st) await rec.camTo(660, 520, 1.45, 1000);
      await page.getByText(/OCR concluído/).first().waitFor({ timeout: 60000 }).catch(() => {});
      await sleep(300);
      await rec.scroll(215, 850);
      await sleep(400);
      const f1 = await frameEl(rec, page.getByText('Leitura de identificação'), { pad: 250, maxZ: 1.85, dur: 1300, dy: 150 });
      await sleep(2300);
      if (f1) await rec.camTo(f1.x, f1.y + 200, f1.z, 1600);
      await sleep(1900);
      const ok = page.getByRole('button', { name: /Confirmar selecionado/ }).first();
      const c = await rec.moveTo(ok, 950);
      if (c) await rec.camTo(c.x + 40, c.y - 150, 1.62, 900);
      await sleep(500);
      if (c) await rec.click(ok, { ms: 300, hold: 60 });
      await sleep(1200);
      await frameEl(rec, page.getByText('Leitura de identificação'), { pad: 250, maxZ: 1.65, dur: 1300, dy: 110 });
      await sleep(1600);
    },
  },
  {
    name: 's2_padronizacao',
    async setup(page) {
      await page.goto(`${BASE}/preencher/${token()}`, { waitUntil: 'networkidle' });
      await sleep(900);
      await page.getByRole('button', { name: /^Continuar/ }).click();
      await sleep(900);
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('h2,div')].find((n) => /Sugestão padronizada/.test(n.textContent || '') && n.children.length < 3);
        el?.scrollIntoView({ block: 'center' });
      });
      await sleep(700);
    },
    async run(rec, page) {
      await sleep(400);
      await rec.camTo(700, 400, 1.15, 900);
      const f1 = await frameSpan(rec, page.getByText(/TEXTO ATUAL/), page.getByText('Sugestão padronizada'), { pad: 60, maxZ: 1.5, dur: 1200, dy: 40 });
      await sleep(2100);
      await rec.scroll(150, 900);
      await sleep(300);
      await frameEl(rec, page.getByText(/Transformações aplicadas/), { pad: 190, maxZ: 1.6, dur: 1300, dx: 200, dy: 130 });
      await sleep(1700);
      const acc = page.getByRole('button', { name: /Aceitar sugestão/ }).first();
      const c = await rec.moveTo(acc, 900);
      if (c) await rec.camTo(c.x + 90, c.y - 30, 1.5, 800);
      await sleep(600);
      if (c) await rec.click(acc, { ms: 260, hold: 40 });
      await sleep(1400);
      await frameSpan(rec, page.getByText(/TEXTO ATUAL/), page.getByText('Sugestão padronizada'), { pad: 60, maxZ: 1.45, dur: 1300, dy: 60 });
      await sleep(1800);
    },
  },
  {
    name: 's3_aprovacao',
    async setup(page) {
      await login(page, 'Marta');
      await page.goto(`${BASE}/relatorios/r_143?tab=revisao`, { waitUntil: 'networkidle' });
      await sleep(1200);
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('button')].find((b) => /Aprovar relatório/.test(b.textContent || ''));
        el?.scrollIntoView({ block: 'center' });
      });
      await sleep(800);
    },
    async run(rec, page) {
      await sleep(500);
      await rec.camTo(880, 430, 1.12, 900);
      await frameEl(rec, page.getByText('Checklist de revisão'), { pad: 210, maxZ: 1.5, dur: 1300, dx: 170, dy: 130 });
      await sleep(1700);
      const btn = page.getByRole('button', { name: /Aprovar relatório/ }).first();
      const b = await rec.moveTo(btn, 800);
      if (b) await rec.camTo(b.x + 130, b.y - 30, 1.45, 800);
      await sleep(600);
      if (b) await rec.click(btn, { ms: 800 });
      await sleep(900);
      await frameEl(rec, page.getByText('Confirmar aprovação humana'), { pad: 210, maxZ: 1.7, dur: 1100 });
      await sleep(1500);
      const conf = page.getByRole('button', { name: /Confirmar aprovação/ }).first();
      const c = await rec.moveTo(conf, 800);
      await sleep(500);
      if (c) await rec.click(conf, { ms: 240, hold: 40 });
      await sleep(1100);
      await frameEl(rec, page.getByText(/Aprovado por/), { pad: 260, maxZ: 1.8, dur: 1300, dx: 250, dy: -20 });
      await sleep(2100);
    },
  },
  {
    name: 's4_auditoria',
    async setup(page) {
      await login(page, 'Marta');
      await page.goto(`${BASE}/relatorios/r_143?tab=historico`, { waitUntil: 'networkidle' });
      await sleep(1200);
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('h2')].find((h) => /Trilha de auditoria/.test(h.textContent || ''));
        el?.scrollIntoView({ block: 'center' });
        window.scrollBy(0, -140);
      });
      await sleep(800);
    },
    async run(rec, page) {
      await sleep(400);
      await rec.camTo(880, 440, 1.15, 900);
      const f = await frameEl(rec, page.getByText('Trilha de auditoria'), { pad: 150, maxZ: 1.5, dur: 1300, dx: 240, dy: 250 });
      await sleep(2300);
      if (f) await rec.camTo(f.x, f.y + 140, f.z, 1500);
      await sleep(2000);
    },
  },
  {
    name: 's5_duas_versoes',
    async setup(page) {
      await login(page, 'Marta');
      // garante o relatório aprovado (a geração dos PDFs só libera após a aprovação)
      await page.goto(`${BASE}/relatorios/r_143?tab=revisao`, { waitUntil: 'networkidle' });
      await sleep(1200);
      const ap = page.getByRole('button', { name: /Aprovar relatório/ });
      if (await ap.count().catch(() => 0)) {
        await ap.first().click();
        await sleep(700);
        const cf = page.getByRole('button', { name: /Confirmar aprovação/ });
        if (await cf.count().catch(() => 0)) await cf.first().click();
        await sleep(1500);
      }
      await page.goto(`${BASE}/relatorios/r_143?tab=documentos`, { waitUntil: 'networkidle' });
      await sleep(1400);
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(400);
    },
    async run(rec, page) {
      await sleep(400);
      await rec.camTo(880, 400, 1.10, 900);
      await frameSpan(rec, page.getByText('Relatório para o cliente'), page.getByText('Relatório interno'), { pad: 70, maxZ: 1.3, dur: 1200, dy: 30 });
      await sleep(900);
      const gen = page.getByRole('button', { name: /Gerar os 2 PDFs/ }).first();
      const g = await rec.moveTo(gen, 700);
      if (g) await rec.camTo(g.x - 60, g.y + 110, 1.35, 800);
      await sleep(500);
      if (g) await rec.click(gen, { ms: 700 });
      await sleep(1500);
      await frameSpan(rec, page.getByText('Relatório para o cliente'), page.getByText('Relatório interno'), { pad: 70, maxZ: 1.35, dur: 1200, dy: 70 });
      await sleep(1600);
      await rec.scroll(280, 1200);
      await sleep(300);
      await frameEl(rec, page.getByText('Versões arquivadas'), { pad: 210, maxZ: 1.5, dur: 1300, dx: 400, dy: 130 });
      await sleep(1900);
    },
  },
  {
    name: 's6_busca',
    async setup(page) {
      await login(page, 'Helena');
      await page.goto(`${BASE}/relatorios`, { waitUntil: 'networkidle' });
      await sleep(900);
      // a busca é feita antes da gravação: o filtro bloqueia o compositor por alguns segundos
      await page.getByPlaceholder(/Buscar código, cliente, equipamento/).fill('Serra');
      await sleep(1600);
    },
    async run(rec, page) {
      await sleep(400);
      await rec.camTo(800, 400, 1.10, 900);
      await sleep(700);
      const f = await frameSpan(rec, page.getByText('RELATÓRIO').first(), page.getByText('PRAZO').first(), { pad: 120, maxZ: 1.4, dur: 1400, dy: 230 });
      await sleep(2400);
      if (f) await rec.camTo(f.x + 60, f.y + 40, Math.min(1.5, f.z + 0.08), 1800);
      await sleep(2400);
      await rec.scroll(120, 1200);
      await sleep(1600);
    },
  },
  {
    name: 's7_historico',
    async setup(page) {
      await login(page, 'Helena');
      await page.goto(`${BASE}/relatorios/r_143?tab=texto`, { waitUntil: 'networkidle' });
      await sleep(1200);
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('h2')].find((h) => /Comparação de textos/.test(h.textContent || ''));
        el?.scrollIntoView({ block: 'center' });
        window.scrollBy(0, -110);
      });
      await sleep(800);
    },
    async run(rec, page) {
      await sleep(400);
      await rec.camTo(880, 400, 1.12, 900);
      await frameSpan(rec, page.getByText(/TEXTO ATUAL/), page.getByText('SUGESTÃO'), { pad: 60, maxZ: 1.5, dur: 1300, dy: 150 });
      await sleep(2000);
      await rec.scroll(190, 1100);
      await sleep(300);
      await frameEl(rec, page.getByText(/Versões do texto/), { pad: 230, maxZ: 1.6, dur: 1300, dx: 420, dy: 90 });
      await sleep(1800);
    },
  },
];

const { browser, context } = await boot({ width: VW, height: VH, dpr: DPR });
const page = await context.newPage();
await page.addInitScript(() => {
  try { localStorage.setItem('safip-theme', 'light'); } catch { /* noop */ }
});
for (const shot of SHOTS) {
  if (ONLY.length && !ONLY.includes(shot.name)) continue;
  console.log('▶', shot.name);
  const geo = (await shot.setup(page)) || {};
  const rec = new Rec(page, shot.name);
  await rec.start();
  await shot.run(rec, page, geo);
  await sleep(1500); // cauda: dá tempo ao loop de captura de recuperar o ritmo
  await rec.stop();
}
await browser.close();
