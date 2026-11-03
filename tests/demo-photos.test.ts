/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEMO_PHOTOS } from '../src/data/demoPhotos';
import { seedReports } from '../src/data/seed';
import { demoOcrResult } from '../src/services/ocr';

/* Galeria demonstrativa: variedade, arquivos reais e OCR simulado coerente. */

describe('Galeria de fotos demonstrativas', () => {
  it('tem pelo menos 12 imagens e todas existem em public/demo', () => {
    expect(DEMO_PHOTOS.length).toBeGreaterThanOrEqual(12);
    for (const d of DEMO_PHOTOS) {
      expect(d.src.startsWith('/demo/')).toBe(true);
      expect(existsSync(resolve(process.cwd(), 'public', d.src.slice(1))), d.src).toBe(true);
    }
  });

  it('não repete a mesma imagem dentro de um relatório e usa variedade no seed', () => {
    const used = new Set<string>();
    for (const r of seedReports) {
      const srcs = r.fotos.map((f) => f.src).filter(Boolean) as string[];
      expect(new Set(srcs).size, `fotos duplicadas em ${r.codigo}`).toBe(srcs.length);
      srcs.forEach((s) => used.add(s));
    }
    expect(used.size).toBeGreaterThanOrEqual(10);
  });

  it('OCR simulado reconhece as novas imagens da galeria com candidatos coerentes', () => {
    expect(demoOcrResult('/demo/foto-camera-externa.jpg').candidatos[0].normalizado).toBe('EQ-4520');
    expect(demoOcrResult('/demo/foto-painel-cp101.jpg').candidatos[0].normalizado).toBe('CP-101');
    const galileo = demoOcrResult('/demo/foto-galileo-rotograma.jpg');
    expect(galileo.candidatos.some((c) => c.tipo === 'imei' && c.normalizado === '867782071392430')).toBe(true);
    expect(galileo.textoBruto).toContain('simulação');
  });
});
