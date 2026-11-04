import { describe, expect, it } from 'vitest';
import { fmtDate, fmtShortDate, initials } from '../src/lib/format';

describe('Formatação de datas e nomes', () => {
  it('preserva o dia de uma data sem horário em fuso brasileiro', () => {
    const previous = process.env.TZ;
    process.env.TZ = 'America/Sao_Paulo';
    try {
      expect(fmtDate('2026-01-10')).toBe('10/01/2026');
      expect(fmtShortDate('2026-01-10')).toBe('10 de jan');
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });

  it('trata datas inválidas e nomes vazios sem quebrar a tela', () => {
    expect(fmtDate('inválida')).toBe('—');
    expect(fmtShortDate('inválida')).toBe('—');
    expect(initials('   ')).toBe('');
    expect(initials('Helena Duarte')).toBe('HD');
  });
});
