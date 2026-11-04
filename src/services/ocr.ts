/*
  Reconhecimento de números de equipamentos em fotografias.

  · OCR REAL no navegador: Tesseract.js 7 (WASM) com worker, core e modelo de
    idioma servidos localmente de /public/ocr — nenhuma imagem sai do dispositivo.
  · O resultado é SEMPRE tratado como sugestão: a confirmação humana é obrigatória
    antes de associar o número ao caminhão/relatório.
  · Modo demonstrativo (motor: 'demo') existe apenas como fallback rotulado,
    nunca se passando por OCR real.
*/
import { createWorker, type Worker } from 'tesseract.js';
import type { Equipment, OcrCandidate } from '../data/types';
import { uid } from '../lib/id';

let workerPromise: Promise<Worker> | null = null;

export type OcrProgress = { status: string; progress: number };

export function getOcrWorker(onProgress?: (p: OcrProgress) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      workerPath: '/ocr/worker.min.js',
      corePath: '/ocr/core',
      langPath: '/ocr/lang',
      logger: (m: { status: string; progress: number }) => onProgress?.({ status: m.status, progress: m.progress }),
    }).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

export async function terminateOcr(): Promise<void> {
  if (workerPromise) {
    const w = await workerPromise.catch(() => null);
    await w?.terminate();
    workerPromise = null;
  }
}

/** Pré-processamento: escala, tons de cinza e expansão de contraste (fotos de campo). */
export async function preprocessImage(src: string, maxSide = 1600): Promise<string> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // Tons de cinza + histograma para percentis
  const hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) {
    const g = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    px[i] = px[i + 1] = px[i + 2] = g;
    hist[g]++;
  }
  const total = w * h;
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.02) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.02) { hi = v; break; } }
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < px.length; i += 4) {
    const g = Math.max(0, Math.min(255, Math.round(((px[i] - lo) / range) * 255)));
    px[i] = px[i + 1] = px[i + 2] = g;
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
    img.src = src;
  });
}

/** Corrige confusões típicas de OCR em posições numéricas (O→0, I→1, S→5…). */
export function normalizeDigits(raw: string): { value: string; altered: boolean } {
  const map: Record<string, string> = { O: '0', o: '0', Q: '0', I: '1', l: '1', '|': '1', S: '5', B: '8', Z: '2', G: '6' };
  let altered = false;
  const value = raw.replace(/[OoQIl|SBZG]/gi, (c) => { altered = true; return map[c] ?? map[c.toUpperCase()] ?? c; });
  return { value, altered };
}

/** Extrai candidatos de identificação do texto bruto do OCR. */
export function extractCandidates(text: string, baseConfidence: number): OcrCandidate[] {
  const out: OcrCandidate[] = [];
  const seen = new Set<string>();
  const push = (valor: string, normalizado: string, conf: number, tipo: OcrCandidate['tipo']) => {
    const key = `${tipo}:${normalizado}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ valor: valor.trim(), normalizado, confianca: Math.round(Math.max(5, Math.min(99, conf))), tipo });
  };

  // Códigos no padrão EQ-XXXX (aceita espaço e confusões de caracteres)
  for (const m of text.matchAll(/\bEQ[\s\-–—]?([0-9OoQIl|SBZG]{3,6})\b/gi)) {
    const { value, altered } = normalizeDigits(m[1]);
    if (/^\d{3,6}$/.test(value)) {
      push(m[0], `EQ-${value}`, baseConfidence - (altered ? 8 : 0), 'codigo');
    }
  }
  // Leitura degradada "Q-2041" (E inicial perdido) — penalizada, exige conferência
  for (const m of text.matchAll(/\bQ[\s\-–]([0-9OoQIl|SBZG]{3,6})\b/gi)) {
    const { value, altered } = normalizeDigits(m[1]);
    if (/^\d{3,6}$/.test(value)) {
      push(m[0], `EQ-${value}`, baseConfidence - 15 - (altered ? 8 : 0), 'codigo');
    }
  }
  // Códigos de equipamentos de cliente: SA-101, VA-205, SR-305, HZ-401…
  for (const m of text.matchAll(/\b([A-Z]{2,4})[\s\-–]([A-Z0-9]{2,6})\b/gi)) {
    const prefix = m[1].toUpperCase();
    if (['SN', 'ID', 'NO', 'IMEI', 'EQ'].includes(prefix)) continue;
    const suffix = m[2].toUpperCase();
    push(m[0], `${prefix}-${suffix}`, baseConfidence - 2, 'codigo');
  }
  // IMEI / IDs longos de câmera e Galileo (15 dígitos)
  for (const m of text.matchAll(/\b(\d{15})\b/g)) {
    push(m[0], m[1], baseConfidence - 4, 'imei');
  }
  // Seriais "SN 12345" / "S/N 12345"
  for (const m of text.matchAll(/\bS\/?N[\s:.\-]?([0-9OoQIl|SBZG]{3,8})\b/gi)) {
    const { value, altered } = normalizeDigits(m[1]);
    if (/^\d{3,8}$/.test(value)) {
      push(m[0], value, baseConfidence - 3 - (altered ? 8 : 0), 'serial');
    }
  }
  // Números isolados de 4–6 dígitos (potenciais identificações)
  for (const m of text.matchAll(/\b(\d{4,6})\b/g)) {
    push(m[0], m[1], baseConfidence - 12, 'numero');
  }
  return out.sort((a, b) => b.confianca - a.confianca).slice(0, 8);
}

/**
  Detecta a região da etiqueta (mancha clara, compacta, sem tocar as bordas)
  via componentes conexos em máscara reduzida. Heurística leve para fotos de
  campo: etiquetas adesivas brancas sobre equipamento escuro.
*/
export async function detectLabelRegion(src: string): Promise<string | null> {
  const img = await loadImage(src);
  const sw = 360;
  const sh = Math.max(1, Math.round(img.height * (sw / img.width)));
  const canvas = document.createElement('canvas');
  canvas.width = sw; canvas.height = sh;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, sw, sh);
  const px = ctx.getImageData(0, 0, sw, sh).data;

  const mask = new Uint8Array(sw * sh);
  for (let i = 0; i < mask.length; i++) {
    const g = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    mask[i] = g > 160 ? 1 : 0;
  }
  const seen = new Uint8Array(sw * sh);
  const stack: number[] = [];
  let best: { area: number; x0: number; y0: number; x1: number; y1: number } | null = null;

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    stack.length = 0;
    stack.push(start);
    seen[start] = 1;
    let area = 0, x0 = sw, y0 = sh, x1 = 0, y1 = 0, touches = false;
    while (stack.length) {
      const cur = stack.pop()!;
      const cy = (cur / sw) | 0, cx = cur % sw;
      area++;
      if (cx < x0) x0 = cx; if (cx > x1) x1 = cx;
      if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
      if (cx === 0 || cy === 0 || cx === sw - 1 || cy === sh - 1) touches = true;
      const neighbors = [cur - 1, cur + 1, cur - sw, cur + sw];
      for (const nb of neighbors) {
        if (nb < 0 || nb >= mask.length) continue;
        if ((nb === cur - 1 && cx === 0) || (nb === cur + 1 && cx === sw - 1)) continue;
        if (!mask[nb] || seen[nb]) continue;
        seen[nb] = 1;
        stack.push(nb);
      }
    }
    if (touches || area < sw * sh * 0.012) continue;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const fill = area / (bw * bh);
    const ar = bw / bh;
    if (fill > 0.5 && ar > 1.0 && ar < 5.0) {
      if (!best || area > best.area) best = { area, x0, y0, x1, y1 };
    }
  }
  if (!best) return null;

  const scale = img.width / sw;
  const pad = Math.round(10 * scale);
  const cx0 = Math.max(0, Math.round(best.x0 * scale) - pad);
  const cy0 = Math.max(0, Math.round(best.y0 * scale) - pad);
  const cx1 = Math.min(img.width, Math.round(best.x1 * scale) + pad);
  const cy1 = Math.min(img.height, Math.round(best.y1 * scale) + pad);
  const out = document.createElement('canvas');
  out.width = cx1 - cx0; out.height = cy1 - cy0;
  out.getContext('2d')!.drawImage(img, cx0, cy0, cx1 - cx0, cy1 - cy0, 0, 0, cx1 - cx0, cy1 - cy0);
  return out.toDataURL('image/png');
}

export interface OcrRunResult {
  textoBruto: string;
  confianca: number;
  candidatos: OcrCandidate[];
  duracaoMs: number;
}

/**
  Executa OCR real (Tesseract WASM local) com pipeline multi-pass para fotos de campo:
  · imagem completa em PSM 6 (bloco) e PSM 11 (texto esparso);
  · recorte automático da etiqueta (quando detectada) nos dois modos;
  · candidatos mesclados com boost de concordância entre passes.
  A confiança reportada é a do Tesseract — sem maquiagem. Leituras ruins
  aparecem com confiança baixa e exigem conferência humana.
*/
export async function runOcr(imageSrc: string, onProgress?: (p: OcrProgress) => void): Promise<OcrRunResult> {
  const started = performance.now();
  const worker = await getOcrWorker(onProgress);
  const prepared = await preprocessImage(imageSrc);
  const crop = await detectLabelRegion(prepared).catch(() => null);

  const passes: Array<{ img: string; psm: '6' | '11'; label: string }> = [
    { img: prepared, psm: '6', label: 'imagem completa (bloco)' },
    { img: prepared, psm: '11', label: 'imagem completa (esparso)' },
  ];
  if (crop) {
    passes.push({ img: crop, psm: '6', label: 'etiqueta recortada (bloco)' });
    passes.push({ img: crop, psm: '11', label: 'etiqueta recortada (esparso)' });
  }

  const merged = new Map<string, { cand: OcrCandidate; hits: number }>();
  let bestText = '';
  let bestScore = -1;
  let maxConf = 0;

  for (let i = 0; i < passes.length; i++) {
    const pass = passes[i];
    onProgress?.({ status: `Analisando ${pass.label} (${i + 1}/${passes.length})…`, progress: i / passes.length });
    await worker.setParameters({ tessedit_pageseg_mode: pass.psm as never });
    const { data } = await worker.recognize(pass.img);
    const text = (data.text ?? '').trim();
    const conf = Math.round(data.confidence ?? 0);
    maxConf = Math.max(maxConf, conf);
    const cands = extractCandidates(text, conf);
    const score = cands.filter((c) => c.tipo === 'codigo').length * 100 + cands.length * 10 + conf;
    if (score > bestScore) { bestScore = score; bestText = text; }
    for (const cand of cands) {
      const key = `${cand.tipo}:${cand.normalizado}`;
      const prev = merged.get(key);
      if (prev) {
        prev.hits++;
        prev.cand.confianca = Math.max(prev.cand.confianca, cand.confianca);
      } else {
        merged.set(key, { cand: { ...cand }, hits: 1 });
      }
    }
  }
  onProgress?.({ status: 'Consolidando resultados…', progress: 0.95 });

  const candidatos = [...merged.values()]
    .map(({ cand, hits }) => ({ ...cand, confianca: Math.min(97, cand.confianca + (hits - 1) * 6) }))
    .sort((a, b) => (a.tipo === 'codigo' ? -1 : 1) - (b.tipo === 'codigo' ? -1 : 1) || b.confianca - a.confianca)
    .slice(0, 8);

  return {
    textoBruto: bestText || '(nenhum texto reconhecido)',
    confianca: maxConf,
    candidatos,
    duracaoMs: Math.round(performance.now() - started),
  };
}

export interface EquipmentMatch {
  candidate: OcrCandidate;
  equipment: Equipment | null;
  conflitoCaminhao: boolean; // cadastrado em outro caminhão que o do relatório
}

/** Compara candidatos com o cadastro de equipamentos (associação sugerida, nunca automática).
  Números isolados também são comparados ao sufixo numérico dos códigos (ex.: "2041" → EQ-2041),
  sempre como SUGESTÃO sujeita à confirmação humana. */
export function matchCandidates(candidatos: OcrCandidate[], equipamentos: Equipment[], caminhaoId: string): EquipmentMatch[] {
  return candidatos.map((candidate) => {
    const norm = candidate.normalizado.toUpperCase();
    const eq = equipamentos.find((e) => {
      if (e.codigo.toUpperCase() === norm) return true;
      if (candidate.tipo === 'serial' && e.serial === candidate.normalizado) return true;
      if (candidate.tipo === 'imei') {
        return e.cameraFadiga === candidate.normalizado || e.galileo === candidate.normalizado || e.serial === candidate.normalizado;
      }
      if (candidate.tipo === 'numero' || candidate.tipo === 'telemetria' || candidate.tipo === 'pulsus') {
        const suffix = e.codigo.split('-')[1];
        return suffix === candidate.normalizado || e.serial === candidate.normalizado
          || e.telemetria === candidate.normalizado || e.pulsus === candidate.normalizado;
      }
      return false;
    }) ?? null;
    return {
      candidate,
      equipment: eq,
      conflitoCaminhao: !!eq && !!eq.truckId && eq.truckId !== caminhaoId,
    };
  });
}

/**
  Gera uma foto SINTÉTICA de teste (canvas) com etiqueta legível.
  Útil para demonstrar o OCR real de ponta a ponta sem depender de câmera.
  Identificada como imagem sintética na legenda.
*/
export async function generateSyntheticPhoto(codigo: string, serial: string): Promise<string> {
  const w = 960, h = 600;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Fundo: chapa metálica escura com ruído
  ctx.fillStyle = '#2b3138';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const v = 35 + Math.random() * 45;
    ctx.fillStyle = `rgba(${v},${v + 4},${v + 8},${0.25 + Math.random() * 0.3})`;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 1 + Math.random() * 2);
  }
  // Parafusos
  for (const [x, y] of [[70, 70], [w - 70, 70], [70, h - 70], [w - 70, h - 70]]) {
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#4a525c'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#22262b'; ctx.fill();
  }

  // Etiqueta branca levemente rotacionada
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.028);
  const lw = 620, lh = 300;
  ctx.fillStyle = '#f4f4f0';
  ctx.fillRect(-lw / 2, -lh / 2, lw, lh);
  ctx.strokeStyle = '#c9c9c2'; ctx.lineWidth = 4;
  ctx.strokeRect(-lw / 2 + 8, -lh / 2 + 8, lw - 16, lh - 16);
  ctx.fillStyle = '#101214';
  ctx.textAlign = 'center';
  ctx.font = '700 104px "JetBrains Mono Variable", monospace';
  ctx.fillText(codigo, 0, 6);
  ctx.font = '600 46px "JetBrains Mono Variable", monospace';
  ctx.fillText(`SN ${serial}`, 0, 92);
  ctx.restore();

  // Poeira/arranhões sobre a etiqueta
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(60,55,45,${Math.random() * 0.16})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 1 + Math.random() * 2);
  }
  return canvas.toDataURL('image/jpeg', 0.92);
}

/** Fallback DEMONSTRATIVO (rotulado) quando o WASM não está disponível.
  * Conhece as imagens da galeria demonstrativa para devolver candidatos coerentes
  * com a etiqueta fotografada. Ainda assim é SIMULAÇÃO e exige confirmação humana. */
export function demoOcrResult(photoSrc: string): OcrRunResult {
  const known: Array<{ keys: string[]; codigo: string; serial?: string; imei?: string; conf: number }> = [
    { keys: ['eq2041', 'instalacao-chicote'], codigo: 'EQ-2041', serial: '88231', conf: 93 },
    { keys: ['eq1087', 'chassi-gps'], codigo: 'EQ-1087', serial: '45102', conf: 88 },
    { keys: ['eq3315', 'camera-fadiga'], codigo: 'EQ-3315', serial: '71590', conf: 58 },
    { keys: ['camera-externa'], codigo: 'EQ-4520', serial: '60415', conf: 86 },
    { keys: ['sensor-carga'], codigo: 'EQ-2988', serial: '33078', conf: 84 },
    { keys: ['checklist-campo'], codigo: 'EQ-5102', serial: '90233', conf: 79 },
    { keys: ['painel-sa101'], codigo: 'SA-101', serial: '0187', conf: 90 },
    { keys: ['tablet-pulsus'], codigo: 'SA-101', serial: '2741', conf: 82 },
    { keys: ['galileo-rotograma'], codigo: 'HZ-410', imei: '867782071392430', conf: 76 },
  ];
  const src = photoSrc.toLowerCase();
  const hit = known.find((k) => k.keys.some((key) => src.includes(key)));
  const codigo = hit?.codigo ?? `EQ-${String(1000 + Math.floor(Math.random() * 9000))}`;
  const serial = hit?.serial ?? String(10000 + Math.floor(Math.random() * 89999));
  const conf = hit?.conf ?? 72;
  const candidatos: OcrCandidate[] = [
    { valor: codigo, normalizado: codigo, confianca: conf, tipo: 'codigo' },
  ];
  if (hit?.imei) {
    candidatos.push({ valor: hit.imei, normalizado: hit.imei, confianca: conf - 3, tipo: 'imei' });
  } else {
    candidatos.push({ valor: `SN ${serial}`, normalizado: serial, confianca: conf - 4, tipo: 'serial' });
  }
  const lines = [codigo, hit?.imei ? `ID ${hit.imei}` : `SN ${serial}`, '(simulação — OCR não executado)'];
  return {
    textoBruto: lines.join('\n'),
    confianca: conf,
    candidatos,
    duracaoMs: 0,
  };
}

export function newDetectionId(): string {
  return uid('det');
}
