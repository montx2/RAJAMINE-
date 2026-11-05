import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const FFMPEG = '/home/user/tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg';

/** Monta um vídeo a partir dos frames capturados de um shot, recortando
 *  [from, to] (epoch seconds) e preenchendo até `duration` segundos. */
export function shotFromFrames({ frames, info, from, to, duration, out, fps = 30 }) {
  const list = path.join(path.dirname(frames[0].file), 'list.txt');
  const sel = frames.filter((f) => f.ts >= from - 0.001 && f.ts <= to + 0.001);
  if (sel.length < 2) throw new Error('frames insuficientes');
  const lines = [];
  for (let i = 0; i < sel.length; i++) {
    const a = sel[i].ts;
    const b = i + 1 < sel.length ? sel[i + 1].ts : Math.min(to, a + 1 / fps);
    const d = Math.max(1 / fps, b - a);
    lines.push(`file '${sel[i].file}'`, `duration ${d.toFixed(4)}`);
  }
  // garante a duração exata pedida
  const covered = sel.reduce((acc, f, i) => {
    const a = f.ts;
    const b = i + 1 < sel.length ? sel[i + 1].ts : Math.min(to, a + 1 / fps);
    return acc + Math.max(1 / fps, b - a);
  }, 0);
  if (covered < duration) lines.push(`file '${sel.at(-1).file}'`, `duration ${(duration - covered).toFixed(4)}`);
  lines.push(`file '${sel.at(-1).file}'`);
  fs.writeFileSync(list, lines.join('\n'));

  execFileSync(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', list,
    '-vf', `fps=${fps},scale=1920:1080:flags=lanczos,format=yuv420p`,
    '-t', String(duration),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  return out;
}

export function loadShot(name) {
  const dir = `/tmp/frames/${name}`;
  const info = JSON.parse(fs.readFileSync(path.join(dir, 'info.json'), 'utf8'));
  const ts = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
  const frames = files.map((f, i) => ({ file: path.join(dir, f), ts: ts[i] }));
  return { dir, info, frames };
}
