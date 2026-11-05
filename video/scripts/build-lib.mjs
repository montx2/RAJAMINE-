/**
 * Build: transforma as tomadas gravadas (frames 1600x900 + marcações de tempo)
 * em vídeo 1920x1080 @30fps.
 *
 * Câmera (zoom/pan), cursor, cliques, legendas e cartelas são reconstruídos com
 * expressões analíticas em cima dos frames — o movimento fica perfeitamente
 * suave mesmo com a captura em ~8 fps, e o texto é reescalado com Lanczos.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const FFMPEG = '/home/user/tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg';
const FPS = 30;
const SRC_W = 1600;
const SRC_H = 900;
const OUT_W = 1920;
const OUT_H = 1080;
const SX = OUT_W / SRC_W; // 1.2
const A = 'assets/gen';

const VARS = { on: `(on/${FPS})`, t: 't' };
const smooth = (u) => `(${u}*${u}*(3-2*${u}))`;

/** interpolacão suave (smoothstep) entre keyframes */
function piecewise(keys, field, v = VARS.on, scale = 1) {
  const ks = [...keys].sort((a, b) => a.t - b.t);
  if (ks.length === 1) return String(ks[0][field] * scale);
  const seg = (i) => {
    const a = ks[i];
    const b = ks[i + 1];
    const dt = Math.max(b.t - a.t, 0.001);
    const u = `min(max((${v}-${a.t.toFixed(3)})/${dt.toFixed(3)},0),1)`;
    const va = (a[field] * scale).toFixed(3);
    const vb = (b[field] * scale).toFixed(3);
    return `(${va} + (${vb} - ${va}) * ${smooth(u)})`;
  };
  let expr = String(ks.at(-1)[field] * scale);
  for (let i = ks.length - 2; i >= 0; i--) {
    expr = `if(lt(${v},${ks[i + 1].t.toFixed(3)}), ${seg(i)}, ${expr})`;
  }
  return expr;
}

function readFrames(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort().map((f) => path.join(dir, f));
}

export function buildShot({ shot, out, captions = [], cards = [], duration }) {
  const json = JSON.parse(fs.readFileSync(`/tmp/shots/${shot}.json`, 'utf8'));
  const dir = `/tmp/frames/${shot}`;
  const files = readFrames(dir);
  const ts = json.frames;
  const dur = duration ?? json.duration;

  // concatenação com as durações reais de cada frame
  const lines = [];
  for (let i = 0; i < files.length; i++) {
    const t = ts[i];
    if (t > dur) break;
    const next = i + 1 < files.length ? ts[i + 1] : dur;
    const d = Math.max(1 / FPS, Math.min(next, dur) - t);
    lines.push(`file '${files[i]}'`, `duration ${d.toFixed(4)}`);
  }
  lines.push(`file '${files.at(-1)}'`);
  const listFile = `/tmp/frames/${shot}/list.txt`;
  fs.writeFileSync(listFile, lines.join('\n'));

  const inputs = ['-f', 'concat', '-safe', '0', '-i', listFile];
  const filters = [];
  let idx = 1;
  const addInput = (args) => { inputs.push(...args); return idx++; };
  const loopImg = (png) => addInput(['-loop', '1', '-framerate', String(FPS), '-t', String(dur + 1), '-i', `${A}/${png}.png`]);

  // 1. base: sobe para 1080p
  filters.push(`[0:v]fps=${FPS},scale=${OUT_W}:${OUT_H}:flags=lanczos,setsar=1,format=rgba[base]`);

  // 2. cursor (espaço do frame, antes da câmera) — sobreposto direto na base
  let last = 'base';
  {
    const cursorIdx = loopImg('cursor');
    const cxExpr = piecewise(json.cursor, 'x', VARS.t, SX);
    const cyExpr = piecewise(json.cursor, 'y', VARS.t, SX);
    const cs = Math.round(48 * SX);
    filters.push(`[${cursorIdx}:v]scale=${cs}:${cs},format=rgba[cur]`);
    filters.push(`[${last}][cur]overlay=x='${cxExpr}-${Math.round(29 * SX)}':y='${cyExpr}-${Math.round(5 * SX)}'[v1]`);
    last = 'v1';
  }

  // 3. flashes de clique
  json.clicks.forEach((c, i) => {
    const ci = loopImg('click');
    const sz = Math.round(104 * SX);
    filters.push(`[${ci}:v]scale=${sz}:${sz},format=rgba[clk${i}]`);
    filters.push(`[${last}][clk${i}]overlay=x=${Math.round(c.x * SX - sz / 2)}:y=${Math.round(c.y * SX - sz / 2)}:enable='between(t,${(c.t + 0.62).toFixed(2)},${(c.t + 0.95).toFixed(2)})'[c${i}]`);
    last = `c${i}`;
  });

  // 4. câmera
  const z = piecewise(json.cam, 'z', VARS.on);
  const cx = piecewise(json.cam, 'x', VARS.on, SX);
  const cy = piecewise(json.cam, 'y', VARS.on, SX);
  // janela de recorte: OUT/z pixels de entrada, centrada em (cx,cy) e presa dentro do quadro
  const clampX = `max(0,min((${cx})-${OUT_W}/2/(${z}),${OUT_W}-${OUT_W}/(${z})))`;
  const clampY = `max(0,min((${cy})-${OUT_H}/2/(${z}),${OUT_H}-${OUT_H}/(${z})))`;
  filters.push(`[${last}]zoompan=z='${z}':x='${clampX}':y='${clampY}':d=1:s=${OUT_W}x${OUT_H}:fps=${FPS}[camz]`);
  filters.push(`[camz]unsharp=5:5:0.35:5:5:0[sharp]`);
  last = 'sharp';

  // 5. legendas
  captions.forEach((cap, i) => {
    const ci = loopImg(cap.png);
    const fin = (cap.in ?? 0.25).toFixed(2);
    const fout = (cap.out ?? dur - 0.25).toFixed(2);
    filters.push(`[${ci}:v]scale=iw/2:ih/2,format=rgba,fade=t=in:st=${fin}:d=0.45:alpha=1,fade=t=out:st=${(fout - 0.45).toFixed(2)}:d=0.45:alpha=1[cap${i}]`);
    filters.push(`[${last}][cap${i}]overlay=x=56:y='${OUT_H}-overlay_h-48':enable='between(t,${fin},${fout})'[capo${i}]`);
    last = `capo${i}`;
  });

  // 6. cartelas
  cards.forEach((card, i) => {
    const ci = loopImg(card.png);
    const fin = (card.in ?? 0).toFixed(2);
    const fout = (card.out ?? dur).toFixed(2);
    const fd = card.fade ?? 0.5;
    filters.push(`[${ci}:v]scale=${OUT_W}:${OUT_H},format=rgba,fade=t=in:st=${fin}:d=${fd}:alpha=1,fade=t=out:st=${(fout - fd).toFixed(2)}:d=${fd}:alpha=1[card${i}]`);
    filters.push(`[${last}][card${i}]overlay=0:0:enable='between(t,${fin},${fout})'[cardo${i}]`);
    last = `cardo${i}`;
  });

  filters.push(`[${last}]format=yuv420p[vout]`);

  execFileSync(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '[vout]', '-t', String(dur),
    '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  console.log('✓', path.basename(out), `${dur}s`);
  return out;
}

/** segmento de cartela estática com push-in suave (imagem -> vídeo) */
export function buildCardVideo({ png, out, duration, z0 = 1.0, z1 = 1.06, fadeIn = 0.5, fadeOut = 0.5 }) {
  execFileSync(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-loop', '1', '-framerate', String(FPS), '-t', String(duration), '-i', `${A}/${png}.png`,
    '-vf', [
      `fps=${FPS}`,
      `zoompan=z='${z0}+(${z1}-${z0})*(on/${FPS})/${duration}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${OUT_W}x${OUT_H}:fps=${FPS}`,
      `fade=t=in:st=0:d=${fadeIn}`,
      `fade=t=out:st=${(duration - fadeOut).toFixed(2)}:d=${fadeOut}`,
      'format=yuv420p',
    ].join(','),
    '-t', String(duration), '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  console.log('✓', path.basename(out), `${duration}s (cartela)`);
  return out;
}

/** concatena os segmentos e aplica o fade global */
export function concat(segments, out, { fadeIn = 0.4, fadeOut = 0.7, total } = {}) {
  const listFile = '/tmp/concat.txt';
  fs.writeFileSync(listFile, segments.map((s) => `file '${path.resolve(s)}'`).join('\n'));
  const dur = total ?? null;
  execFileSync(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-vf', `fade=t=in:st=0:d=${fadeIn}${dur ? `,fade=t=out:st=${(dur - fadeOut).toFixed(2)}:d=${fadeOut}` : ''},format=yuv420p`,
    ...(dur ? ['-t', String(dur)] : []),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  console.log('✓ master', path.basename(out), `(${segments.length} segmentos)`);
  return out;
}

/** duração total dos segmentos */
export function durationOf(segment) {
  const out = execFileSync(FFMPEG, ['-hide_banner', '-i', segment], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return 0;
}
