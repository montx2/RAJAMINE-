/**
 * Harness de gravação: captura frames por CDP screencast (timestamps reais),
 * cursor sintético, zoom "clean" aplicado no próprio navegador (texto nítido,
 * pois o Chrome re-rasteriza) e legendas/capítulos em camada fixa.
 */
import { chromium as pw } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
import fs from 'node:fs';
import path from 'node:path';

export const BASE = 'http://localhost:5173';
const FRAME_ROOT = '/tmp/frames';

export async function boot({ width = 1920, height = 1080, dpr = 1 } = {}) {
  const executablePath = await sparticuz.executablePath();
  const browser = await pw.launch({
    executablePath,
    headless: true,
    args: [
      ...sparticuz.args.filter((a) => !a.startsWith('--single-process')),
      '--font-render-hinting=none',
      '--disable-lcd-text',
      '--force-color-profile=srgb',
      '--hide-scrollbars',
    ],
  });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  return { browser, context, width, height };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ─────────────────────────── captura ─────────────────────────── */
export class Shot {
  constructor(page, name, size) {
    this.page = page;
    this.name = name;
    this.size = size;
    this.frames = [];
  }

  async begin() {
    this.dir = path.join(FRAME_ROOT, this.name);
    fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
    this.cdp = await this.page.context().newCDPSession(this.page);
    this.cdp.on('Page.screencastFrame', async (f) => {
      const file = path.join(this.dir, String(this.frames.length).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
      this.frames.push({ file, ts: f.metadata.timestamp });
      try { await this.cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch { /* sessão encerrada */ }
    });
    await this.cdp.send('Page.enable');
    await this.cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 88,
      maxWidth: this.size.width,
      maxHeight: this.size.height,
      everyNthFrame: 1,
    });
    await sleep(250);
    this.t0 = Date.now() / 1000;
    return this;
  }

  /** Marca o início do trecho útil (em segundos epoch, mesma base do CDP). */
  mark() {
    this.mt = Date.now() / 1000;
    return this.mt;
  }

  async end() {
    await sleep(200);
    try { await this.cdp.send('Page.stopScreencast'); } catch { /* ignore */ }
    const n = this.frames.length;
    const dur = n > 1 ? this.frames.at(-1).ts - this.frames[0].ts : 0;
    const info = { name: this.name, frames: n, seconds: +dur.toFixed(2), fps: +(n / Math.max(dur, 0.01)).toFixed(1), mark: this.mt ?? this.frames[0]?.ts };
    fs.writeFileSync(path.join(this.dir, 'info.json'), JSON.stringify(info, null, 1));
    fs.writeFileSync(path.join(this.dir, 'timeline.json'), JSON.stringify(this.frames.map((f) => f.ts)));
    return info;
  }
}

/* ─────────────────────── ferramentas na página ─────────────────────── */
export async function injectTools(page) {
  await page.evaluate(() => {
    if (window.__d) return;
    const d = {};
    /* camada de zoom: envolve #root (não usa wrapper extra para não quebrar
       portais; o transform vai no próprio #root) */
    let root = null;
    let zoom = 1;
    d.init = () => {
      root = document.getElementById('root');
      if (!root) return;
      root.style.transformOrigin = '0 0';
      root.style.transition = 'transform 900ms cubic-bezier(.22,.8,.16,1)';
      // desativa rolagem suave para o scroll programático ser previsível
      const style = document.createElement('style');
      style.id = 'demo-style';
      style.textContent = `
        html { scroll-behavior: auto !important; }
        #demo-cursor, #demo-ripple, #demo-caption, #demo-card { font-family: var(--font-sans), system-ui, sans-serif; }
        #demo-cursor { position: absolute; left: 0; top: 0; z-index: 2147483000; pointer-events: none;
          transform: translate(-100px, -100px); will-change: transform; filter: drop-shadow(0 3px 6px rgba(0,0,0,.28)); }
        #demo-ripple { position: absolute; left: 0; top: 0; z-index: 2147482999; pointer-events: none; }
        #demo-caption { position: fixed; left: 56px; bottom: 52px; z-index: 2147482000; pointer-events: none;
          display: flex; align-items: center; gap: 14px; padding: 14px 22px 14px 18px; border-radius: 14px;
          background: rgba(24,24,27,.88); color: #fff; backdrop-filter: blur(10px);
          box-shadow: 0 18px 44px rgba(0,0,0,.32); opacity: 0; transform: translateY(14px);
          transition: opacity 420ms ease, transform 520ms cubic-bezier(.22,.8,.16,1); max-width: 1000px; }
        #demo-caption.on { opacity: 1; transform: translateY(0); }
        #demo-caption .bar { width: 4px; align-self: stretch; border-radius: 4px; background: #FFC400; }
        #demo-caption .k { font-size: 11.5px; letter-spacing: .14em; text-transform: uppercase; color: #FFC400; font-weight: 700; }
        #demo-caption .t { font-size: 19px; line-height: 1.25; font-weight: 500; letter-spacing: -.01em; }
        #demo-card { position: fixed; inset: 0; z-index: 2147482500; pointer-events: none; opacity: 0;
          background: #121214; transition: opacity 520ms ease; display: grid; place-items: center; }
        #demo-card.on { opacity: 1; }
      `;
      document.head.appendChild(style);
      const cur = document.createElement('div');
      cur.id = 'demo-cursor';
      cur.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M5.2 3.1 L17.9 12.1 L11.9 13.2 L9.3 18.9 Z" fill="#ffffff" stroke="#18181B" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
      const rip = document.createElement('div');
      rip.id = 'demo-ripple';
      const cap = document.createElement('div');
      cap.id = 'demo-caption';
      cap.innerHTML = '<div class="bar"></div><div><div class="k"></div><div class="t"></div></div>';
      const card = document.createElement('div');
      card.id = 'demo-card';
      document.body.append(cap, card, rip, cur);
    };

    d.pos = (el) => {
      const r = el.getBoundingClientRect();
      return { sx: r.left + r.width / 2, sy: r.top + r.height / 2, w: r.width, h: r.height };
    };
    /* cursor em coordenadas de documento (dentro do #root, que é transformado) */
    d.cursor = (x, y) => {
      const c = document.getElementById('demo-cursor');
      if (c) c.style.transform = `translate(${x - 3}px, ${y - 2}px)`;
    };
    d.ripple = (x, y) => {
      const r = document.getElementById('demo-ripple');
      if (!r) return;
      r.innerHTML = `<span style="position:absolute;left:${x}px;top:${y}px;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:999px;
        border:2px solid #FFC400;animation:demoRip 620ms ease-out forwards"></span>`;
      if (!document.getElementById('demo-kf')) {
        const s = document.createElement('style');
        s.id = 'demo-kf';
        s.textContent = '@keyframes demoRip{0%{transform:scale(.4);opacity:.95}100%{transform:scale(6.5);opacity:0}}';
        document.head.appendChild(s);
      }
    };
    d.zoomTo = (el, scale, opts = {}) => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const sx = r.left + r.width / 2, sy = r.top + r.height / 2;
      // ponto focal em coordenadas de documento
      const cx = sx + window.scrollX, cy = sy + window.scrollY;
      const vcx = vw / 2 + (opts.dx || 0), vcy = vh / 2 + (opts.dy || 0);
      const s = scale;
      const ox = (vcx - s * cx) / (1 - s);
      const oy = (vcy - s * cy) / (1 - s);
      zoom = s;
      root.style.transformOrigin = `${ox}px ${oy}px`;
      root.style.transform = `scale(${s})`;
      return { cx, cy };
    };
    d.zoomPoint = (cx, cy, scale, opts = {}) => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const vcx = vw / 2 + (opts.dx || 0), vcy = vh / 2 + (opts.dy || 0);
      const s = scale;
      const ox = (vcx - s * cx) / (1 - s);
      const oy = (vcy - s * cy) / (1 - s);
      zoom = s;
      root.style.transformOrigin = `${ox}px ${oy}px`;
      root.style.transform = `scale(${s})`;
    };
    d.reset = () => { root.style.transform = 'scale(1)'; root.style.transformOrigin = '0 0'; zoom = 1; };
    d.zoomDur = (ms) => { root.style.transition = `transform ${ms}ms cubic-bezier(.22,.8,.16,1)`; };
    /* legenda */
    d.caption = (kicker, text) => {
      const c = document.getElementById('demo-caption');
      if (!c) return;
      if (!text) { c.classList.remove('on'); return; }
      c.querySelector('.k').textContent = kicker || '';
      c.querySelector('.t').textContent = text;
      c.classList.add('on');
    };
    /* capítulo full-screen */
    d.card = (html) => {
      const c = document.getElementById('demo-card');
      if (!c) return;
      if (html === null) { c.classList.remove('on'); return; }
      c.innerHTML = html;
      c.classList.add('on');
    };
    /* zoom no modal (portal no body, fora do #root) */
    d.modalZoom = (scale) => {
      const m = document.querySelector('body > div[role="dialog"]');
      if (!m) return false;
      m.style.transformOrigin = '50% 50%';
      m.style.transition = 'transform 800ms cubic-bezier(.22,.8,.16,1)';
      m.style.transform = `scale(${scale})`;
      return true;
    };
    window.__d = d;
  });
  await page.evaluate(() => window.__d.init());
}

/* ─────────────────────── ações de "câmera" e mouse ─────────────────────── */
export async function cursorTo(page, target, ms = 600) {
  const box = typeof target === 'string' ? await page.locator(target).first().boundingBox() : target;
  if (!box) return;
  const sx = box.x + box.width / 2;
  const sy = box.y + box.height / 2;
  const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const from = await page.evaluate(() => {
    const c = document.getElementById('demo-cursor');
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(c.style.transform || '');
    return m ? { x: +m[1] + 3, y: +m[2] + 2 } : { x: 240, y: 240 };
  });
  // posição atual do cursor em coordenadas de viewport
  const fx = from.x - scroll.x;
  const fy = from.y - scroll.y;
  const steps = Math.max(10, Math.round(ms / 18));
  for (let i = 1; i <= steps; i++) {
    const t = ease(i / steps);
    const vx = fx + (sx - fx) * t;
    const vy = fy + (sy - fy) * t;
    await page.evaluate(([x, y]) => window.__d.cursor(x, y), [vx + scroll.x, vy + scroll.y]);
    await page.mouse.move(vx, vy);
    await sleep(ms / steps);
  }
  await page.evaluate(([x, y]) => window.__d.cursor(x, y), [sx + scroll.x, sy + scroll.y]);
  await page.mouse.move(sx, sy);
}

export async function clickAt(page, target, { ms = 520, hold = 90 } = {}) {
  await cursorTo(page, target, ms);
  await sleep(hold);
  const p = await page.evaluate(() => {
    const c = document.getElementById('demo-cursor');
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(c.style.transform || '');
    return m ? { x: +m[1] + 3, y: +m[2] + 2 } : { x: 0, y: 0 };
  });
  await page.evaluate(([x, y]) => window.__d.ripple(x, y), [p.x, p.y]);
  const box = typeof target === 'string' ? await page.locator(target).first().boundingBox() : target;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await sleep(60);
  await page.mouse.up();
}

/** clique com ripple usando seletor/locator */
export async function clickEl(page, locator, opts) {
  const el = locator.first ? locator.first() : locator;
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(120);
  const box = await el.boundingBox();
  if (!box) throw new Error('elemento sem caixa para clique');
  await clickAt(page, box, opts);
}

export async function typeInto(page, locator, text, { cps = 45, clear = false } = {}) {
  const el = locator.first ? locator.first() : locator;
  await el.click();
  if (clear) await el.fill('');
  for (const ch of text) {
    await page.keyboard.type(ch);
    await sleep(1000 / cps);
  }
}

export async function smoothScroll(page, dy, ms = 900) {
  const steps = Math.max(10, Math.round(ms / 20));
  const per = dy / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((v) => window.scrollBy(0, v), per);
    await sleep(ms / steps);
  }
}

export async function focusEl(page, selector, scale, { ms = 1000, dx = 0, dy = 0, scrollFirst = true } = {}) {
  if (scrollFirst) {
    const el = typeof selector === 'string' ? page.locator(selector).first() : selector;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(150);
  }
  await page.evaluate(([sel, s, ddx, ddy]) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : null;
    window.__d.zoomDur(1000);
    if (el) window.__d.zoomTo(el, s, { dx: ddx, dy: ddy });
  }, [typeof selector === 'string' ? selector : null, scale, dx, dy]);
  await sleep(ms);
}

export async function caption(page, kicker, text) {
  await page.evaluate(([k, t]) => window.__d.caption(k, t), [kicker, text]);
}

export async function showCard(page, html) {
  await page.evaluate((h) => window.__d.card(h), html);
}

export function chapterCard({ num, title, sub }) {
  return `
  <div style="position:absolute;inset:0;background:
      radial-gradient(1200px 680px at 18% 12%, rgba(255,196,0,.13), transparent 62%),
      radial-gradient(900px 600px at 88% 96%, rgba(255,196,0,.06), transparent 60%), #121214;"></div>
  <div style="position:absolute;inset:0;opacity:.5;background-image:linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px);background-size:100% 46px;"></div>
  <div style="position:relative;padding:0 120px;max-width:1500px;">
    <div style="display:flex;align-items:center;gap:20px;">
      <div style="height:2px;width:64px;background:#FFC400;"></div>
      <div style="font-size:13px;letter-spacing:.34em;text-transform:uppercase;color:#FFC400;font-weight:700;">Cena ${num}</div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:44px;margin-top:26px;">
      <div style="font-family:var(--font-display),sans-serif;font-size:190px;line-height:.82;font-weight:700;color:rgba(255,196,0,.9);letter-spacing:-.03em;">${num}</div>
      <div style="padding-top:14px;">
        <div style="font-family:var(--font-display),sans-serif;font-size:60px;line-height:1.06;font-weight:600;color:#FAFAFA;letter-spacing:-.02em;max-width:900px;">${title}</div>
        <div style="margin-top:18px;font-size:19px;color:#9C9CA3;letter-spacing:.01em;max-width:760px;">${sub}</div>
      </div>
    </div>
  </div>`;
}
