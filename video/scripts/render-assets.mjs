/** Renderiza os PNGs de apoio (cursor, legendas, cartelas de capítulo) usando
 *  o próprio navegador, com o design system do app (fontes + cores da marca). */
import { chromium as pw } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
import fs from 'node:fs';

const OUT = 'assets/gen';
fs.mkdirSync(OUT, { recursive: true });

const exe = await sparticuz.executablePath();
const browser = await pw.launch({
  executablePath: exe,
  headless: true,
  args: [...sparticuz.args.filter((a) => !a.startsWith('--single-process')), '--font-render-hinting=none'],
});

const FONTS = `
  @font-face { font-family: 'Barlow Semi Condensed'; font-weight: 600; src: local('Barlow Semi Condensed'); }
`;
const APP_CSS = `
  html, body { margin: 0; background: transparent; }
  .sans { font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif; }
  .disp { font-family: 'Barlow Semi Condensed', 'IBM Plex Sans', system-ui, sans-serif; }
`;

async function shot(name, { width, height, dpr = 2, html }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600); // garante o carregamento das webfonts do app
  await page.evaluate((css) => {
    document.head.innerHTML = `<style>${css}</style>`;
    document.body.innerHTML = '';
  }, APP_CSS + FONTS);
  await page.evaluate((h) => { document.body.innerHTML = h; }, html);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${name}.png`, omitBackground: true });
  await ctx.close();
  console.log('·', name);
}

/* cursor: seta branca com contorno grafite + sombra suave */
await shot('cursor', {
  width: 48, height: 48,
  html: `<div style="width:48px;height:48px;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35))">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <path d="M5.4 2.6 L19.4 12.4 L12.7 13.6 L9.8 20.2 Z" fill="#ffffff" stroke="#151519" stroke-width="1.45" stroke-linejoin="round"/>
    </svg></div>`,
});

/* clique: halo âmbar */
await shot('click', {
  width: 96, height: 96,
  html: `<div style="width:96px;height:96px;display:grid;place-items:center">
    <div style="width:96px;height:96px;border-radius:999px;background:
      radial-gradient(circle, rgba(255,196,0,.55) 0%, rgba(255,196,0,.30) 42%, rgba(255,196,0,0) 70%)"></div>
  </div>`,
});

/* legendas (kicker + texto) */
const CAPTIONS = {
  c_ocr: ['OCR LOCAL', 'Número de série e IMEI reconhecidos na foto'],
  c_ocr2: ['VALIDAÇÃO HUMANA', 'O resultado só é aceito após conferência'],
  c_pad: ['PADRONIZAÇÃO', 'Relato reescrito na 3ª pessoa, sem alterar fatos'],
  c_aprov: ['APROVAÇÃO OBRIGATÓRIA', 'Revisão humana antes de liberar ao cliente'],
  c_rastreio: ['RASTREABILIDADE', 'Quem aprovou, quando e o que mudou'],
  c_duas: ['DUAS VERSÕES', 'Cliente (sem fotos) e arquivo interno (completo)'],
  c_busca: ['BUSCA E FILTROS', 'Encontre o relatório por código, cliente ou equipamento'],
  c_hist: ['HISTÓRICO DE ALTERAÇÕES', 'Cada ação registrada na trilha de auditoria'],
  c_versoes: ['VERSÕES PRESERVADAS', 'O texto original do colaborador nunca é sobrescrito'],
  c_seg: ['SEGURANÇA E CONFORMIDADE', 'Criptografia, backups, LGPD e OWASP'],
};
for (const [key, [kicker, text]] of Object.entries(CAPTIONS)) {
  await shot(key, {
    width: 1180, height: 132,
    html: `<div class="sans" style="display:inline-flex;align-items:stretch;gap:18px;padding:22px 34px 22px 24px;
        border-radius:16px;background:rgba(20,20,22,.90);backdrop-filter:blur(14px);
        box-shadow:0 24px 60px rgba(0,0,0,.42), inset 0 0 0 1px rgba(255,255,255,.07);">
      <div style="width:5px;border-radius:5px;background:#FFC400"></div>
      <div>
        <div style="font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:#FFC400;font-weight:700">${kicker}</div>
        <div style="margin-top:7px;font-size:26px;line-height:1.22;font-weight:500;color:#F7F7F8;letter-spacing:-.012em;white-space:nowrap">${text}</div>
      </div>
    </div>`,
  });
}

/* cartelas de capítulo */
function card(num, title, sub) {
  return `<div class="sans" style="width:1920px;height:1080px;position:relative;overflow:hidden;
      background:
        radial-gradient(1200px 700px at 16% 8%, rgba(255,196,0,.14), transparent 60%),
        radial-gradient(1000px 640px at 88% 100%, rgba(255,196,0,.07), transparent 58%),
        #121214;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px);background-size:100% 48px;"></div>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding-left:150px;padding-right:150px;">
      <div style="display:flex;align-items:center;gap:22px;">
        <div style="height:2px;width:70px;background:#FFC400"></div>
        <div style="font-size:16px;letter-spacing:.36em;text-transform:uppercase;color:#FFC400;font-weight:700">Cena ${num}</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:48px;margin-top:30px;">
        <div class="disp" style="font-size:220px;line-height:.8;font-weight:700;color:#FFC400;letter-spacing:-.04em">${num}</div>
        <div style="padding-top:18px;">
          <div class="disp" style="font-size:74px;line-height:1.02;font-weight:600;color:#FAFAFA;letter-spacing:-.02em;max-width:1050px">${title}</div>
          <div style="margin-top:22px;font-size:24px;color:#9C9CA3;max-width:860px;line-height:1.35">${sub}</div>
        </div>
      </div>
      <div style="margin-top:74px;display:flex;align-items:center;gap:14px;color:#6E6E76;font-size:19px;letter-spacing:.02em">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3 21 20H3L12 3Z" fill="#FFC400"/></svg>
        SAFIP FieldOps · Relatórios de campo
      </div>
    </div>
  </div>`;
}
await shot('card4', { width: 1920, height: 1080, dpr: 2, html: card('04', 'Demonstração das funcionalidades', 'OCR, padronização, revisão humana e geração automática dos documentos') });
await shot('card5', { width: 1920, height: 1080, dpr: 2, html: card('05', 'Segurança e benefícios', 'Rastreabilidade completa e proteção dos dados em toda a operação') });

/* cartela final */
await shot('card_end', {
  width: 1920, height: 1080, dpr: 2,
  html: `<div class="sans" style="width:1920px;height:1080px;position:relative;overflow:hidden;background:
      radial-gradient(1100px 640px at 50% 0%, rgba(255,196,0,.12), transparent 62%), #121214;">
    <div style="position:absolute;inset:0;display:grid;place-items:center">
      <div style="text-align:center">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" style="display:block;margin:0 auto 26px"><path d="M12 3 21 20H3L12 3Z" fill="#FFC400"/></svg>
        <div class="disp" style="font-size:64px;font-weight:600;color:#FAFAFA;letter-spacing:-.02em">SAFIP FieldOps</div>
        <div style="margin-top:16px;font-size:23px;color:#9C9CA3">Relatórios de campo padronizados, revisados e rastreáveis</div>
        <div style="margin-top:38px;height:2px;width:120px;margin-left:auto;margin-right:auto;background:rgba(255,196,0,.55)"></div>
        <div style="margin-top:34px;display:flex;gap:34px;justify-content:center;color:#7B7B84;font-size:17px;letter-spacing:.06em;text-transform:uppercase">
          <span>OCR local</span><span>·</span><span>Revisão humana</span><span>·</span><span>Auditoria</span><span>·</span><span>LGPD</span>
        </div>
      </div>
    </div>
  </div>`,
});


/* infográfico de segurança + benefícios (usado na cena 5) */
const item = (icon, title, sub) => `
  <div style="display:flex;gap:18px;align-items:flex-start;margin-bottom:46px">
    <div style="width:52px;height:52px;border-radius:14px;background:rgba(255,196,0,.13);display:grid;place-items:center;flex:0 0 auto">
      ${icon}
    </div>
    <div>
      <div style="font-size:27px;font-weight:600;color:#F4F4F5;letter-spacing:-.01em">${title}</div>
      <div style="margin-top:7px;font-size:19px;color:#8E8E96;line-height:1.35;max-width:520px">${sub}</div>
    </div>
  </div>`;
const svg = (path) => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFC400" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
await shot('seg_info', {
  width: 1920, height: 1080, dpr: 2,
  html: `<div class="sans" style="width:1920px;height:1080px;position:relative;overflow:hidden;background:
      radial-gradient(1200px 720px at 12% 4%, rgba(255,196,0,.11), transparent 62%),
      radial-gradient(900px 600px at 92% 100%, rgba(255,196,0,.06), transparent 58%), #101012;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.026) 1px, transparent 1px);background-size:100% 48px"></div>
    <div style="position:relative;padding:96px 120px">
      <div style="display:flex;align-items:center;gap:20px">
        <div style="height:2px;width:70px;background:#FFC400"></div>
        <div style="font-size:15px;letter-spacing:.32em;text-transform:uppercase;color:#FFC400;font-weight:700">Versão de produção</div>
      </div>
      <div class="disp" style="margin-top:22px;font-size:62px;font-weight:600;color:#FAFAFA;letter-spacing:-.02em">Segurança desde a concepção</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 96px;margin-top:64px">
        <div>
          ${item(svg('<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'), 'Criptografia', 'Dados protegidos em trânsito e em repouso')}
          ${item(svg('<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v13c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-13"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>'), 'Backups e recuperação', 'Rotinas de cópia e restauração testadas')}
          ${item(svg('<path d="M12 3l7.5 3v6c0 4.2-3 7.4-7.5 9-4.5-1.6-7.5-4.8-7.5-9V6z"/><path d="M9 12l2 2 4-4"/>'), 'LGPD', 'Base legal, minimização e rastreabilidade')}
          ${item(svg('<path d="M12 21s7-3.6 7-9V5.6L12 3 5 5.6V12c0 5.4 7 9 7 9z"/><path d="M9.5 12l1.8 1.8 3.4-3.6"/>'), 'Acesso por perfil', 'Cada papel vê somente o que precisa')}
        </div>
        <div>
          ${item(svg('<path d="M12 2.5l8 3.5v6.2c0 4.6-3.3 8.2-8 9.8-4.7-1.6-8-5.2-8-9.8V6z"/><path d="M12 8v6"/><path d="M9 11h6"/>'), 'OWASP Top 10', 'Controles de aplicação e autenticação')}
          ${item(svg('<path d="M4 19V9m5 10V5m5 14v-7m5 7V8"/>'), 'Menos trabalho manual', 'Padronização e geração automáticas')}
          ${item(svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'), 'Sem perda de informação', 'Versões, fotos e trilha completas')}
          ${item(svg('<path d="M3.5 12a8.5 8.5 0 1 0 8.5-8.5"/><path d="M12 7.5V12l3 2"/>'), 'Rastreabilidade', 'Quem aprovou, quando e o que mudou')}
        </div>
      </div>
    </div>
    <div style="position:absolute;left:120px;right:120px;bottom:70px;display:flex;align-items:center;gap:16px;color:#7A7A82;font-size:20px;border-top:1px solid rgba(255,255,255,.08);padding-top:26px">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3 21 20H3L12 3Z" fill="#FFC400"/></svg>
        Eficiência, organização e segurança em toda a operação
    </div>
  </div>`,
});

await browser.close();
