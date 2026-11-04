import { describe, it, expect } from 'vitest';
import { normalizeDigits, extractCandidates, matchCandidates, demoOcrResult } from '../src/services/ocr';
import type { Equipment } from '../src/data/types';

describe('Extração e normalização de identificações (OCR)', () => {
  it('corrige confusões típicas O→0, I→1, S→5 em posições numéricas', () => {
    expect(normalizeDigits('2O41')).toEqual({ value: '2041', altered: true });
    expect(normalizeDigits('1O87')).toEqual({ value: '1087', altered: true });
    expect(normalizeDigits('2s4b')).toEqual({ value: '2548', altered: true });
    expect(normalizeDigits('2041')).toEqual({ value: '2041', altered: false });
  });

  it('extrai código EQ e serial de texto bruto', () => {
    const c = extractCandidates('EQ-2041\nSN 88231', 92);
    const codigo = c.find((x) => x.tipo === 'codigo');
    const serial = c.find((x) => x.tipo === 'serial');
    expect(codigo?.normalizado).toBe('EQ-2041');
    expect(serial?.normalizado).toBe('88231');
    expect(codigo!.confianca).toBeGreaterThan(serial!.confianca - 10);
  });

  it('normaliza código lido com caracteres trocados e reduz confiança', () => {
    const c = extractCandidates('EQ-2O41', 90);
    expect(c[0].normalizado).toBe('EQ-2041');
    expect(c[0].confianca).toBeLessThan(90);
    expect(c[0].valor).toBe('EQ-2O41'); // leitura bruta preservada
  });

  it('aceita variações de espaçamento', () => {
    const c = extractCandidates('EQ 3315 etiqueta', 80);
    expect(c.some((x) => x.normalizado === 'EQ-3315')).toBe(true);
  });

  it('não extrai números de contexto irrelevantes como código', () => {
    const c = extractCandidates('texto sem identificacao', 80);
    expect(c.length).toBe(0);
  });

  it('recupera leitura degradada "Q-2041" (E perdido) com penalidade de confiança', () => {
    const c = extractCandidates('Q-2041', 80);
    const cod = c.find((x) => x.tipo === 'codigo');
    expect(cod?.normalizado).toBe('EQ-2041');
    expect(cod!.confianca).toBeLessThan(80);
  });
});

describe('Associação sugerida com o cadastro', () => {
  const eqs: Equipment[] = [
    { id: 'e1', codigo: 'EQ-2041', tipo: 'Telemetria veicular', serial: '88231', status: 'instalado', truckId: 't101' },
    { id: 'e2', codigo: 'EQ-1087', tipo: 'Rastreador GPS', serial: '45102', status: 'instalado', truckId: 't103' },
  ];

  it('encontra equipamento cadastrado pelo código', () => {
    const c = extractCandidates('EQ-2041', 90);
    const m = matchCandidates(c, eqs, 't101');
    expect(m[0].equipment?.id).toBe('e1');
    expect(m[0].conflitoCaminhao).toBe(false);
  });

  it('sinaliza conflito quando o equipamento está em outro caminhão', () => {
    const c = extractCandidates('EQ-2041', 90);
    const m = matchCandidates(c, eqs, 't999');
    expect(m[0].conflitoCaminhao).toBe(true);
  });

  it('código desconhecido não tem associação (exige cadastro na confirmação)', () => {
    const c = extractCandidates('EQ-9999', 90);
    const m = matchCandidates(c, eqs, 't101');
    expect(m[0].equipment).toBeNull();
  });

  it('número isolado sugere associação pelo sufixo do código ou série', () => {
    const c = extractCandidates('2041', 70).filter((x) => x.tipo === 'numero');
    const m = matchCandidates(c, eqs, 't101');
    expect(m[0].equipment?.id).toBe('e1');
    const s = extractCandidates('SN 45102', 80).filter((x) => x.tipo === 'serial');
    const ms = matchCandidates(s, eqs, 't103');
    expect(ms[0].equipment?.id).toBe('e2');
  });

  it('resultado demonstrativo é sempre rotulado como simulação', () => {
    const r = demoOcrResult('/demo/foto-eq2041.jpg');
    expect(r.textoBruto).toContain('simulação');
    expect(r.candidatos[0].normalizado).toBe('EQ-2041');
  });
});
