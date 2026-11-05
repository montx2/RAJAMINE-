import { buildShot, buildCardVideo, concat } from './build-lib.mjs';
import { execFileSync } from 'node:child_process';

const SEG = 'out/seg';
import fs from 'node:fs';
fs.mkdirSync(SEG, { recursive: true });

/* ───────────── CENA 4 — demonstração das funcionalidades (60s) ───────────── */
const cena4 = [
  buildCardVideo({ png: 'card4', out: `${SEG}/c4-card.mp4`, duration: 2.4, fadeIn: 0.5, fadeOut: 0.4 }),
  buildShot({
    shot: 's1_ocr', out: `${SEG}/c4-1-ocr.mp4`, duration: 15.6,
    captions: [
      { png: 'c_ocr', in: 0.9, out: 8.2 },
      { png: 'c_ocr2', in: 8.8, out: 15.0 },
    ],
  }),
  buildShot({
    shot: 's2_padronizacao', out: `${SEG}/c4-2-padronizacao.mp4`, duration: 12.8,
    captions: [{ png: 'c_pad', in: 0.9, out: 12.2 }],
  }),
  buildShot({
    shot: 's3_aprovacao', out: `${SEG}/c4-3-aprovacao.mp4`, duration: 13.0,
    captions: [{ png: 'c_aprov', in: 0.8, out: 12.4 }],
  }),
  buildShot({
    shot: 's4_auditoria', out: `${SEG}/c4-4-auditoria.mp4`, duration: 5.8,
    captions: [{ png: 'c_rastreio', in: 0.5, out: 5.4 }],
  }),
  buildShot({
    shot: 's5_duas_versoes', out: `${SEG}/c4-5-versoes.mp4`, duration: 10.4,
    captions: [{ png: 'c_duas', in: 0.8, out: 9.8 }],
  }),
];

/* ───────────── CENA 5 — segurança e benefícios (30s) ───────────── */
const cena5 = [
  buildCardVideo({ png: 'card5', out: `${SEG}/c5-card.mp4`, duration: 2.2, fadeIn: 0.5, fadeOut: 0.4 }),
  buildShot({
    shot: 's6_busca', out: `${SEG}/c5-1-busca.mp4`, duration: 10.0,
    captions: [{ png: 'c_busca', in: 0.8, out: 9.4 }],
  }),
  buildShot({
    shot: 's7_historico', out: `${SEG}/c5-2-historico.mp4`, duration: 8.6,
    captions: [{ png: 'c_versoes', in: 0.6, out: 8.0 }],
  }),
  buildCardVideo({ png: 'seg_info', out: `${SEG}/c5-3-seguranca.mp4`, duration: 7.0, z0: 1.0, z1: 1.07, fadeIn: 0.45, fadeOut: 0.35 }),
  buildCardVideo({ png: 'card_end', out: `${SEG}/c5-end.mp4`, duration: 2.2, z0: 1.0, z1: 1.04, fadeIn: 0.35, fadeOut: 0.6 }),
];

if (!process.argv.includes('--skip-build')) {
  await Promise.all([...cena4, ...cena5]);
}

concat(cena4, 'out/cena4.mp4', { total: 60 });
concat(cena5, 'out/cena5.mp4', { total: 30 });
concat([...cena4, ...cena5], 'out/cena4-cena5.mp4', { total: 90 });
